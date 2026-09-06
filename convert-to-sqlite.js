const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// 1. Change provider
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');

// 2. Remove @db.Decimal annotations
schema = schema.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');

// 3. Extract and remove enums
const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*{[^}]*}/g;
const enums = [];
let match;
while ((match = enumRegex.exec(schema)) !== null) {
  enums.push(match[1]);
}
schema = schema.replace(enumRegex, '');

// 4. Replace enum types with String and update @default(ENUM_VALUE) to @default("ENUM_VALUE")
enums.forEach(enumName => {
  // Replace enum type in fields (e.g. `role RoleName` -> `role String`)
  // Also handle optional arrays etc if any: `RoleName?` -> `String?`
  const typeRegex = new RegExp(`(\\s+)([A-Za-z0-9_]+)(\\s+)${enumName}(\\??)`, 'g');
  schema = schema.replace(typeRegex, '$1$2$3String$4');
  
  // Actually, some fields might be `role RoleName @default(...)`
  // A safer regex for type replacement in Prisma models:
  // Space followed by FieldName followed by spaces followed by EnumName
  const typeRegex2 = new RegExp(`^(\\s+[A-Za-z0-9_]+\\s+)${enumName}(\\??)`, 'gm');
  schema = schema.replace(typeRegex2, '$1String$2');
});

// 5. Update defaults for enums. E.g. @default(PROSPECT) -> @default("PROSPECT")
// We can just find all @default([A-Z_]+) that are not now(), autoincrement(), uuid(), cuid(), false, true
schema = schema.replace(/@default\(([A-Z_]+)\)/g, (match, p1) => {
  if (['now', 'autoincrement', 'uuid', 'cuid'].includes(p1.toLowerCase())) return match;
  return `@default("${p1}")`;
});

// Also fix Json? to String? since SQLite in Prisma doesn't natively support Json
schema = schema.replace(/(\s+[A-Za-z0-9_]+\s+)Json(\??)/gm, '$1String$2');

fs.writeFileSync(schemaPath, schema);
console.log('Successfully converted schema to SQLite.');
