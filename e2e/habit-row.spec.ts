import {test,expect} from './fixtures';

test('edit quantity by tapping progress; controls stay above the progress bar',async({page})=>{
  await page.setViewportSize({width:320,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await page.getByText('3 / 8 cốc',{exact:true}).click();
  const input=page.getByRole('textbox',{name:'Amount Uống nước',exact:true});
  await expect(input).toBeVisible();
  await input.fill('8');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('8 / 8 cốc',{exact:true})).toBeVisible();
  await expect(page.getByTestId('streak-water')).toHaveAttribute('aria-label',/Selected day complete/);
  await expect(page.getByText('Update',{exact:true})).toHaveCount(0);
  await page.getByText('8 / 8 cốc',{exact:true}).click();
  await input.fill('6');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByText('8 / 8 cốc',{exact:true})).toBeVisible();
  const progress=await page.getByRole('progressbar',{name:'Progress Uống nước',exact:true}).boundingBox();
  for(const action of ['Increase Uống nước','Decrease Uống nước']) {
    const box=await page.getByRole('button',{name:action,exact:true}).boundingBox();
    expect(box!.y+box!.height).toBeLessThanOrEqual(progress!.y);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
