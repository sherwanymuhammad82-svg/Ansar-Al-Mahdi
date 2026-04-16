const translate = require('translate-google');
translate.languages['ckb'] = 'Kurdish (Sorani)';

async function test() {
  try {
    const res = await translate('مرحبا كيف حالك', {to: 'ckb'});
    console.log('Sorani:', res);
  } catch (e) {
    console.error('Error with ckb:', e);
  }
}
test();
