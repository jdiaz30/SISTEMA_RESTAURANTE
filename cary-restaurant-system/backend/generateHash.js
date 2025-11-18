// Script temporal para generar hash de password "123456"
const bcrypt = require('bcryptjs');

const password = '123456';
const hash = bcrypt.hashSync(password, 10);

console.log('\n=================================');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('=================================\n');

// Verificar que funciona
const isValid = bcrypt.compareSync(password, hash);
console.log('Verificacion:', isValid ? '✅ Correcto' : '❌ Error');
