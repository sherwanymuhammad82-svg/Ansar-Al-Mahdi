const translate = require('translate-google');

async function test() {
  try {
    const res = await translate('مرحبا كيف حالك', {to: 'ckb'});
    console.log('Sorani:', res);
  } catch (e) {
    console.error('Error with ckb:', e);
    try {
      const res2 = await translate('مرحبا كيف حالك', {to: 'ku'});
      console.log('Kurmanji:', res2);
    } catch (e2) {
      console.error('Error with ku:', e2);
    }
  }
}
test();
