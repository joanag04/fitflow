# Scripts de Migração

## Migração de Peso para o Modelo de Usuário

Este diretório contém scripts para migrar os dados de peso da coleção `weightentries` para o campo `weight` na coleção `users`.

### Passos para Migração

1. **Fazer backup do banco de dados**
   ```bash
   mongodump --db windsurf-gym-app --out /caminho/para/backup
   ```

2. **Instalar dependências necessárias**
   ```bash
   cd /home/fadmin/Desktop/Projects/windsurf-gym-app/server
   npm install dotenv
   ```

3. **Executar a migração dos dados**
   ```bash
   cd /home/fadmin/Desktop/Projects/windsurf-gym-app/server
   node scripts/migrateWeightToUser.js
   ```

4. **Verificar os dados migrados**
   - Conecte-se ao banco de dados MongoDB
   - Verifique se os usuários têm o campo `weight` preenchido corretamente
   - Verifique se os valores estão corretos

5. **Limpar os dados antigos (opcional)**
   ```bash
   cd /home/fadmin/Desktop/Projects/windsurf-gym-app/server
   node scripts/cleanupWeightEntries.js
   ```

6. **Remover o código não utilizado**
   - Remova os arquivos relacionados a `WeightEntry`
   - Atualize as rotas e controladores para usar o campo `weight` do usuário

### Reversão

Se algo der errado, você pode restaurar o backup do banco de dados:

```bash
mongorestore --db windsurf-gym-app /caminho/para/backup/windsurf-gym-app
```
