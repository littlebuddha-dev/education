// hash-password.js

// $node hash-password.js

// SQL更新
// UPDATE users
// SET password_hash = '出力されたハッシュ文字列'
// WHERE email = '対象のメールアドレス';


const bcrypt = require('bcrypt');

const password = ''; // ← 実際に使いたいパスワードに置き換えてください

bcrypt.hash(password, 10).then(hash => {
  console.log('✅ Bcrypt hash:', hash);
});