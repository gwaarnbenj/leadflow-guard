import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { supabaseAdmin } from '@/lib/supabase';

async function runFormCheck(page: any, goal: any, siteUrl: string) {
  const target = new URL(goal.page_url, siteUrl).toString();
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // Heuristic CTA (v1 keeps it simple)
  const cta = page.locator('a:has-text("Quote"), a:has-text("Contact"), button:has-text("Quote"), button:has-text("Contact")').first();
  if (!(await cta.isVisible())) throw new Error('CTA not visible');

  await cta.click().catch(()=>{});
  await page.waitForTimeout(600);

  const form = page.locator('form, .wpcf7-form, .gform_wrapper form, .wpforms-form, form[action*="elementor"]');
  if (!(await form.first().isVisible())) throw new Error('Form not visible after CTA');

  const f = form.first();
  await f.locator('input[type="text"], input[name*="name"]').first().fill("LeadFlow Guard Test").catch(()=>{});
  await f.locator('input[type="email"]').first().fill("test+lfguard@example.com").catch(()=>{});
  const tel = f.locator('input[type="tel"]'); if (await tel.count()) await tel.first().fill('07123456789');

  await page.evaluate(() => {
    const h = document.createElement('input'); h.type='hidden'; h.name='lf_guard_test'; h.value='true';
    document.querySelector('form')?.appendChild(h);
  });

  const [resp] = await Promise.all([
    page.waitForResponse((r:any)=> r.request().method()==='POST' || r.url().includes('wp-json'), { timeout: 8000 }).catch(()=>null),
    f.evaluate((el:any)=> el.submit())
  ]);

  let domSuccess = false;
  if (goal.success_mode === 'thank_you_url' && goal.thank_you_url) {
    await page.waitForLoadState('load').catch(()=>{});
    domSuccess = page.url().includes(goal.thank_you_url);
  }
  if (goal.success_mode === 'success_selector' && goal.success_selector) {
    domSuccess = domSuccess || await page.locator(goal.success_selector).first().isVisible().catch(()=>false);
  }
  if (goal.provider === 'elementor') domSuccess = domSuccess || await page.locator('.elementor-message-success').first().isVisible().catch(()=>false);
  if (goal.provider === 'cf7') domSuccess = domSuccess || await page.locator('.wpcf7 form.sent, .wpcf7-mail-sent-ok').first().isVisible().catch(()=>false);
  if (goal.provider === 'gravity') domSuccess = domSuccess || await page.locator('.gform_confirmation_message').first().isVisible().catch(()=>false);
  if (goal.provider === 'wpforms') domSuccess = domSuccess || await page.locator('.wpforms-confirmation-container').first().isVisible().catch(()=>false);

  const netOk = !!resp && resp.ok();
  if (!(domSuccess || netOk)) throw new Error(`Submission failed: dom=${domSuccess} net=${netOk}`);
}

export async function POST(req: NextRequest) {
  const { goal_id } = await req.json();
  const { data: goalRow, error } = await supabaseAdmin
    .from('goals')
    .select('*, site:sites(url)')
    .eq('id', goal_id).single();
  if (error || !goalRow) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const browser = await chromium.launch();
  let status: 'pass'|'fail'|'blocked' = 'pass', summary = 'OK';

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }});
    const page = await context.newPage();
    if (goalRow.type === 'form') await runFormCheck(page, goalRow, goalRow.site.url);
    await context.close();
  } catch (e:any) {
    status = 'fail'; summary = e.message || 'check failed';
  } finally {
    await browser.close();
  }

  await supabaseAdmin.from('check_runs').insert({
    goal_id, device: 'desktop', status, summary, details_json: {}
  });
  await supabaseAdmin.from('goals').update({ last_run_at: new Date().toISOString() }).eq('id', goal_id);

  return NextResponse.json({ status, summary });
}
