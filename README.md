# 🎬 Famflix

Una piattaforma moderna per gestire e guardare la tua collezione di film e serie TV.

## 📚 Documentazione

### Per Utenti Finali
- **[SETUP_GUIDA.md](./SETUP_GUIDA.md)** - Guida completa in italiano per installare e configurare Famflix sul tuo computer (consigliata per utenti non-tech)

### Per Self-Hosting
- **[README_SELFHOST.md](./README_SELFHOST.md)** - Guida per configurare Famflix come server casalingo accessibile da remoto via Tailscale

## 🚀 Quick Start

### Prerequisiti
- Docker Desktop installato
- Credenziali Supabase (database)
- API Token TMDB (The Movie Database)

### Installazione Rapida

1. **Clona la repository:**
   ```bash
   git clone https://github.com/tuousername/famflix.git
   cd famflix
   ```

2. **Configura le credenziali:**
   ```bash
   cp .env.local.example .env.local
   # Modifica .env.local con le tue credenziali
   ```

3. **Avvia con Docker:**
   ```bash
   # Su Mac: doppio click su start.command
   # Oppure manualmente:
   docker-compose --env-file .env.local up -d --build
   ```

4. **Accedi all'app:**
   Apri il browser su [http://localhost:3000](http://localhost:3000)

## 🛠️ Sviluppo

Per sviluppatori che vogliono modificare il codice:

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build di produzione
npm run build
npm start
```

## 📋 Variabili d'Ambiente

Crea un file `.env.local` con le seguenti variabili (vedi `.env.local.example` per dettagli):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-chiave-supabase
API_TOKEN_TMDB=la-tua-api-key-tmdb
```

## 🗄️ Database

Il progetto usa Supabase come database. Lo schema SQL è disponibile in:
- `supabase_schema.sql` - Schema completo del database
- `movie_progress_migration.sql` - Migrazione per il tracking dei progressi

## 🎯 Funzionalità

- ✅ Autenticazione utenti con Supabase
- ✅ Multi-profilo (come Netflix)
- ✅ Ricerca film e serie TV tramite TMDB
- ✅ Tracking progressi di visione
- ✅ Liste personalizzate (Preferiti, Continua a guardare)
- ✅ Player video integrato
- ✅ Design responsive e moderno
- ✅ PWA (Progressive Web App)

## 🤝 Condivisione

Se vuoi condividere questo progetto con amici o familiari, segui la **[SETUP_GUIDA.md](./SETUP_GUIDA.md)** che spiega passo-passo come installare tutto.

## 📝 Tecnologie

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **API**: TMDB (The Movie Database)
- **Deployment**: Docker, Docker Compose
- **Autenticazione**: Supabase Auth

## 📄 Licenza

Progetto personale - Uso privato

