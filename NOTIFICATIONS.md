# 📱 Sistema de Notificações PWA - IEEE ProjectHub

Sistema completo de notificações push usando **ntfy.sh** integrado ao PWA.

## 🚀 Funcionalidades Implementadas

### ✅ **Serviço de Notificações** (`services/notificationService.ts`)
- **ntfy.sh integration** - Servidor gratuito de push notifications
- **Subscriptions por usuário** - Tópicos específicos para cada user
- **Subscriptions por role** - Notificações baseadas em cargo/função
- **Notificações gerais** - Para todos os usuários
- **Reconexão automática** - Em caso de falha na conexão
- **Cache local** - Configurações salvas no localStorage

### 🎯 **Sistema de Tópicos**

```typescript
// Tópicos automáticos criados:
ieee-projecthub-general          // 📢 Todos os usuários
ieee-user-{userId}              // 👤 Específico do usuário
ieee-role-{role}                // 👥 Por cargo (president, member, etc.)
```

### 🔧 **Componentes**

#### `NotificationControls` - Configuração de notificações
- Toggle para ativar/desativar
- Solicitação de permissões
- Interface para teste de notificações
- Status de conexão em tempo real

#### `NotificationToast` - Toast de notificações recebidas  
- Animações suaves
- Ícones baseados no tipo de notificação
- Auto-dismiss após 5 segundos
- Barra de progresso

### 🪝 **Hooks Personalizados** (`hooks/useNotifications.ts`)

#### `useNotifications(currentUser)`
```typescript
const {
  isEnabled,        // Se notificações estão ativas
  isConnected,      // Se está conectado ao ntfy.sh
  hasPermission,    // Se tem permissão do browser
  subscriptionInfo, // Info dos tópicos inscritos
  lastNotification, // Última notificação recebida
  toggleNotifications,
  requestPermission,
  sendNotification
} = useNotifications(currentUser);
```

#### `useNotificationToast()`
```typescript
const {
  notifications,     // Lista de notificações ativas
  removeNotification, 
  clearAll
} = useNotificationToast();
```

## 📡 **Como Enviar Notificações**

### 1. **Via Interface** (página Settings)
- Seção "Teste de Notificações"
- Botões: Geral, Pessoal, Por Cargo

### 2. **Via Código**
```typescript
import { notificationService } from '../services/notificationService';

// Notificação geral (todos recebem)
await notificationService.sendGeneralNotification(
  'Reunião cancelada hoje às 19h',
  'Aviso Importante',
  { priority: 4 } // Alta prioridade
);

// Notificação específica para um usuário
await notificationService.sendUserNotification(
  'user123',
  'Sua tarefa foi aprovada!',
  'Parabéns! 🎉'
);

// Notificação por cargo
await notificationService.sendRoleNotification(
  'president',
  'Relatório mensal disponível',
  'Documentos Administrativos'
);
```

### 3. **Via API REST (ntfy.sh)**
```bash
# Geral
curl -d "Mensagem para todos" https://ntfy.sh/ieee-projecthub-general

# Específica 
curl -d "Mensagem pessoal" https://ntfy.sh/ieee-user-123

# Por cargo
curl -H "Title: Reunião de Diretoria" \
     -d "Reunião hoje às 19h" \
     https://ntfy.sh/ieee-role-president
```

## 🔧 **Configuração**

### ntfy.sh Settings
```typescript
const config = {
  server: 'https://ntfy.sh',           // Servidor ntfy
  generalTopic: 'ieee-projecthub-general', // Tópico geral
  userPrefix: 'ieee-user-',            // Prefixo de usuários
  retryInterval: 30000                 // Reconexão (30s)
};
```

### Personalização de Tópicos
Edite em `notificationService.ts`:
```typescript
private getUserTopics(userId: string, role?: string): string[] {
  return [
    this.config.generalTopic,
    `${this.config.userPrefix}${userId}`,
    `ieee-role-${role?.toLowerCase().replace(/\s+/g, '-')}`,
    // Adicione mais tópicos personalizados aqui
    `ieee-chapter-${chapterId}`, // Por chapter
    `ieee-project-${projectId}` // Por projeto
  ];
}
```

## 🎨 **Interface de Usuário**

### Status Visual
- 🟢 **Conectado** - Wifi verde 
- 🔴 **Desconectado** - Wifi cinza/vermelho
- 🔔 **Ativo** - Sino com badge verde pulsante
- 🔕 **Inativo** - Sino riscado

### Notificações por Tipo
- 👥 **Geral** - Ícone azul, múltiplos usuários
- 👤 **Pessoal** - Ícone verde, usuário único
- 👑 **Por Cargo** - Ícone roxo, coroa
- ⚙️ **Sistema** - Ícone cinza, engrenagem

## 📱 **Service Worker Integration**

O service worker (`public/sw.js`) já está configurado para:
- Receber notificações do ntfy.sh
- Personalizar ícones baseado no tipo
- Configurar ações (Abrir, Responder, Fechar)
- Definir prioridade e vibração
- Navegar para URLs específicas

## 🚀 **Como Testar**

### 1. **Local Development**
```bash
npm run dev
# Acesse: http://localhost:3000
# Vá em: Configurações → Notificações
```

### 2. **Ativar Notificações**
1. Clique no toggle "Receber Notificações"
2. Permita notificações no browser
3. Aguarde conexão (status verde)

### 3. **Enviar Teste**
1. Digite mensagem no campo "Teste"
2. Clique em "Geral", "Pessoal" ou "Por Cargo"
3. Notificação aparece como toast e push

### 4. **Teste Externo**
```bash
# Envie via curl/API
curl -d "Teste de notificação" https://ntfy.sh/ieee-projecthub-general
```

## 🔐 **Segurança e Privacidade**

- ✅ **Sem dados sensíveis** - ntfy.sh não requer auth
- ✅ **Tópicos públicos** - Use nomes não óbvios em produção
- ✅ **SSL/TLS** - Conexões criptografadas
- ✅ **Local storage** - Configurações ficam no device
- ✅ **Opt-in** - Usuário controla quando ativar

## 🎯 **Próximos Passos**

### Features Avançadas
- [ ] **Agenda/Schedule** - Notificações programadas
- [ ] **Templates** - Mensagens pré-definidas  
- [ ] **Analytics** - Tracking de entrega/abertura
- [ ] **Admin Dashboard** - Painel para envio em massa
- [ ] **Categorias** - Filtros por tipo de notificação
- [ ] **Rich Notifications** - Imagens, botões customizados

### Integrações
- [ ] **Supabase Real-time** - Sync com banco de dados
- [ ] **Calendar Events** - Lembretes automáticos
- [ ] **Task Updates** - Status de tarefas
- [ ] **Project Milestones** - Marcos de projetos

### Hosting Próprio
- [ ] **Self-hosted ntfy** - Servidor próprio
- [ ] **Firebase FCM** - Google Push Notifications
- [ ] **OneSignal** - Serviço completo de push

## 📚 **Recursos Úteis**

- [ntfy.sh Documentation](https://docs.ntfy.sh/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

🎉 **Sistema completo e funcional!** 

Seu IEEE ProjectHub agora tem notificações push profissionais integradas ao PWA! 📱