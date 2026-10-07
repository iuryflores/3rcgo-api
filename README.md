# API Node.js com TypeScript — 3rcgo

Somente formulário LGPD. POST `/terceiro/send-aviso/` e GET `/health`.
Ouvidoria usa sistema externo e CONTACT_TO não é necessário.

Local: `npm ci`, preencher `.env`, `npm run check`, `npm test`, `npm run build`,
`npm start`. Desenvolvimento: `npm run dev`. SMTP sem enviar mensagem:
`npm run smtp:check`. O frontend permanece com a API atual nesta etapa.

## GitHub Actions → S3 → SSM → EC2

Push na `main` executa o deploy no ambiente GitHub **production**.
Criar as configurações em Settings → Environments → production.

**Secrets:**

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- EC2_INSTANCE_ID
- SMTP_PASS

**Variables:**

| Nome | Exemplo |
| --- | --- |
| AWS_REGION | sa-east-1 |
| AWS_S3_BUCKET_NAME | nome-do-bucket-privado-de-deploy |
| PORT | 9005 |
| ALLOWED_ORIGINS | https://www.terceirocartoriogo.com.br,https://terceirocartoriogo.com.br |
| SMTP_HOST | smtp.hostinger.com |
| SMTP_PORT | 465 |
| SMTP_SECURE | true |
| SMTP_USER | administrador@iuryflores.com.br |
| MAIL_FROM | 3º Cartório de Goiânia <administrador@iuryflores.com.br> |
| LGPD_TO | destinatário das solicitações |

AWS_ROLE_ARN, DEPLOY_BUCKET e CONTACT_TO não são usados pelo workflow atual.
O workflow gera `.env` com os Secrets/Variables, sem imprimir valores sensíveis.
Empacota o código compilado e `.env`, envia com criptografia SSE-S3 para bucket
privado e aguarda o resultado do comando SSM. Não usar bucket de arquivos públicos.
Os artefatos contêm credenciais: limitar acesso ao bucket e configurar expiração.

As chaves AWS precisam de permissões S3 para leitura do bucket, criação quando
necessária, bloqueio de acesso público e PutObject no prefixo `3rcgo/api/`;
SSM SendCommand para a instância/documento AWS-RunShellScript e GetCommandInvocation.
O workflow não usa OIDC. A EC2 precisa de instance profile com
AmazonSSMManagedInstanceCore e s3:GetObject no prefixo dos artefatos.

## Preparação única da EC2 Linux

Instalar Node.js 22, PM2 global, Nginx, curl, AWS CLI e SSM Agent.
O deploy usa o PM2 do usuário ubuntu (HOME=/home/ubuntu e PM2_HOME=/home/ubuntu/.pm2).
O processo se chama **3rcgo-server** e é definido em ecosystem.config.cjs.
Configurar o startup do PM2 para ubuntu com pm2 startup e executar o comando indicado.
Consultar o processo como ubuntu: pm2 status e pm2 logs 3rcgo-server.
Se a versão antiga foi instalada via systemd, parar/desabilitar apenas o serviço 3rcgo-api antes da migração.
Instalar virtual host baseado em `deploy/nginx.conf.example` e configurar HTTPS.
Permitir saída SMTP; não abrir porta 9005 externamente.

O deploy publica releases em `/opt/3rcgo-api/releases/<commit>` com seu `.env`
restrito ao usuário do serviço e configura o link `current`. Reinicia e verifica
`/health` na porta configurada. Se falhar, restaura o release anterior quando
disponível. `/health` confirma o processo, não a entrega SMTP.
Não apaga releases antigos automaticamente; eles contêm a configuração de e-mail.

Nenhum deploy remoto nem envio de e-mail é feito somente por criar estes arquivos.

## Domínio da API

Criar registro DNS A chamado api apontando para o IP público fixo da EC2.
Domínio: api.terceirocartoriogo.com.br. Liberar portas 80 e 443.
Na EC2 Ubuntu, a partir do checkout deste repositório, com Nginx e Certbot instalados:

```bash
sudo install -m 644 deploy/nginx.conf.example /etc/nginx/sites-available/3rcgo-api
sudo ln -sfn /etc/nginx/sites-available/3rcgo-api /etc/nginx/sites-enabled/3rcgo-api
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.terceirocartoriogo.com.br
curl --fail https://api.terceirocartoriogo.com.br/health
```

Executar Certbot após confirmar o DNS. Não sobrescrever virtual hosts de outras aplicações.
O deploy não instala o virtual host automaticamente. Publicar também o frontend
atualizado para conectar o formulário LGPD à nova API. /health deve retornar {"msg":"ok"}.
