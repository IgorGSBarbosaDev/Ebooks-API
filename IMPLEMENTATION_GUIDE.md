# Guia de Implementação — API de Ebooks

## Stack & Escopo

| Categoria       | Tecnologia                            |
| --------------- | ------------------------------------- |
| Backend         | TypeScript, Node.js, Express          |
| Banco de Dados  | PostgreSQL                            |
| ORM             | Prisma                                |
| Arquitetura     | Monolito Modular                      |
| Upload          | Multer (salvando em `/public/covers`) |

**Features:**
- CRUD de ebooks
- Paginação
- Filtro por título e autor
- Busca por slug (gerado automaticamente com unicidade garantida)
- Upload e remoção física de capa
- Tratamento global de erros

---

## Por que a ordem importa?

A lógica central é **construir de dentro para fora**. As camadas internas (domínio) não dependem de nada externo, então devem existir antes. As camadas externas (infraestrutura, apresentação) dependem das internas, então vêm depois. Configurar a base antes evita retrabalho ao precisar ajustar dependências já usadas em múltiplos lugares.

---

## Passo 1 — Inicialização e Configuração do Projeto

Configure o `package.json`, instale as dependências (Express, Prisma, Multer, Zod, TypeScript, etc.) e configure o `tsconfig.json`, `nodemon`/`ts-node-dev` para hot reload, e as variáveis de ambiente.

Crie o `.env` com as variáveis necessárias (ex: `DATABASE_URL`, `PORT`) e, logo em seguida, crie um módulo de configuração que valide essas variáveis na inicialização usando `zod`. Isso garante que a aplicação falhe imediatamente com uma mensagem clara caso uma variável obrigatória esteja ausente, em vez de quebrar silenciosamente em runtime.

**Por quê primeiro?** Tudo depende dessa base. Sem TypeScript configurado corretamente, nada compila. Sem as dependências instaladas, não há como avançar. A validação do ambiente pertence aqui pois é a primeira coisa executada ao subir o servidor.

---

## Passo 2 — Estrutura de Pastas

Crie a estrutura de diretórios do monolito modular antes de escrever qualquer código de negócio:

```
src/
  modules/
    ebook/
      domain/
      application/
      infra/
      presentation/
  shared/
    errors/
    types/
    utils/
public/
  covers/
```

**Por quê segundo?** Definir a estrutura agora evita reorganizações custosas depois. Todos os arquivos já nascem no lugar certo e a arquitetura fica explícita desde o início.

---

## Passo 3 — Camada Shared

Crie os utilitários e tipos compartilhados entre módulos:

- **Classes de erro customizadas** (`AppError`, `NotFoundError`, `ConflictError`, etc.) com código HTTP encapsulado
- **Tipos genéricos reutilizáveis** (ex: tipo de resposta paginada `PaginatedResult<T>`)
- **Utilitário de formatação de slug** — responsável apenas por transformar uma string em formato slug (ex: `"Meu Livro"` → `"meu-livro"`). A validação de unicidade *não* pertence aqui; ela é uma regra de negócio e será tratada nos Use Cases.

**Por quê terceiro?** A camada `shared` não depende de nada interno do projeto — é a camada de menor acoplamento. O domínio e as demais camadas já vão referenciar essas classes de erro e tipos, então precisam existir antes.

---

## Passo 4 — Schema do Banco de Dados (Prisma)

Defina o modelo `Ebook` no `schema.prisma` com todos os campos necessários (id, title, author, slug, description, coverPath, createdAt, updatedAt). Rode a migration inicial para criar a tabela no banco.

> **Observação:** Este passo pode ser executado em paralelo com o Passo 3, pois os dois não dependem um do outro.

**Por quê quarto?** O schema define o "contrato" dos dados. A entidade do domínio será modelada a partir dele e a camada de infraestrutura o utilizará diretamente. Defini-lo antes evita mudanças em cascata nas camadas superiores.

---

## Passo 5 — Camada de Domínio

Defina:

- A **entidade** `Ebook` com suas propriedades e invariantes (ex: slug não pode ser vazio, título é obrigatório)
- A **interface do repositório** (`IEbookRepository`) declarando os métodos esperados: `create`, `findById`, `findBySlug`, `findAll`, `update`, `delete`

**Por quê quinto?** O domínio é o coração da aplicação e não depende de nenhuma tecnologia concreta (nem Prisma, nem Express). Definir a interface do repositório aqui é essencial: garante que a camada de aplicação programe contra uma *abstração*, não contra uma implementação. Isso é o que torna o código testável e desacoplado.

---

## Passo 6 — Camada de Infraestrutura

Implemente os detalhes técnicos que satisfazem os contratos definidos no domínio:

- **Repositório concreto** com Prisma (`PrismaEbookRepository`) que implementa a interface `IEbookRepository`
- **Serviço de armazenamento de arquivos** responsável por salvar e remover fisicamente arquivos em `/public/covers`
- **Configuração do Multer** — o destino, o filtro de tipo de arquivo (aceitar apenas imagens) e os limites de tamanho pertencem aqui, pois são detalhes técnicos de infraestrutura de armazenamento. A camada de Presentation apenas importa e aplica o middleware já configurado.
- **Singleton do cliente Prisma**

**Por quê sexto?** Agora que o contrato (interface) existe e o banco está configurado, é o momento de implementar o detalhe técnico de como os dados e arquivos são persistidos. As camadas superiores (Application, Presentation) não precisam saber *como* isso funciona — elas só conhecem as abstrações.

---

## Passo 7 — Camada de Aplicação (Use Cases)

Crie os casos de uso, um por responsabilidade:

- `CreateEbookUseCase` — gera o slug base a partir do título usando o utilitário do `shared`, consulta o repositório para verificar conflito e, se necessário, adiciona sufixo incremental ou aleatório até garantir unicidade. A verificação de unicidade **vive aqui**, pois é uma regra de negócio que depende do repositório.
- `GetEbookBySlugUseCase`
- `ListEbooksUseCase` — com suporte a paginação e filtros por título e autor
- `UpdateEbookUseCase`
- `DeleteEbookUseCase` — aciona o serviço de storage para remover a capa fisicamente antes de deletar o registro

**Por quê sétimo?** Os casos de uso orquestram a lógica de negócio usando o repositório (via interface) e os utilitários do `shared`. Eles são agnósticos a HTTP, Express ou Multer — esses são detalhes da camada de apresentação.

> **Nota sobre Slug:** O utilitário de formatação de texto (`"Meu Livro"` → `"meu-livro"`) vive no `shared` desde o Passo 3. A lógica de unicidade (consultar o banco e iterar sufixos) é implementada *neste passo* dentro do `CreateEbookUseCase`, pois requer acesso ao repositório que só existe a partir do Passo 6.

---

## Passo 8 — Camada de Apresentação

Crie para o módulo `ebook`:

- **DTOs de entrada** com validação via `zod` (ex: `CreateEbookDto`, `UpdateEbookDto`, `ListEbooksQueryDto`)
- **Controller** que recebe as requisições HTTP, delega ao use case correto e formata a resposta
- **Arquivo de rotas** que mapeia os endpoints para os métodos do controller e aplica o middleware do Multer (configurado na infra) nas rotas de upload

**Por quê oitavo?** A apresentação é a camada mais externa. Só faz sentido construí-la quando a lógica que ela expõe já existe. Inverter essa ordem levaria a controllers chamando métodos que ainda não existem.

---

## Passo 9 — Configuração do Express (App e Server)

Monte os arquivos de entrada da aplicação:

- **`app.ts`** — instância do Express com os middlewares globais registrados (JSON parser, CORS, servir arquivos estáticos de `/public`) e as rotas do módulo ebook. O **middleware global de tratamento de erros** deve ser o **último** a ser registrado, depois de todas as rotas.
- **`server.ts`** — importa o `app` e chama `app.listen`. Separar os dois arquivos é importante: facilita testes de integração (importe o `app` sem subir o servidor na porta).

**Por quê nono?** Só agora todas as peças existem para montar o servidor. O error handler global precisa ser registrado por último, o que só é seguro fazer depois de todas as rotas estarem definidas.

---

## Passo 10 — Testes Manuais e Ajustes

Teste todos os endpoints com Insomnia ou Postman na seguinte ordem lógica:

1. Criar ebook (sem capa) — validar geração de slug
2. Criar ebook com título duplicado — validar unicidade do slug (sufixo esperado)
3. Upload de capa — validar salvamento físico em `/public/covers`
4. Listar ebooks com paginação e filtros por título/autor
5. Buscar por slug
6. Atualizar ebook — validar atualização de campos e possível novo slug
7. Deletar ebook — validar remoção física da capa
8. Testar casos de erro: ebook inexistente (404), payload inválido (400), etc.

**Por quê por último?** Validar o comportamento end-to-end só é possível com tudo integrado. Erros encontrados aqui são de integração entre camadas, não de lógica isolada.

---

## Resumo da Ordem

| # | Passo | Depende de |
|---|---|---|
| 1 | Setup do projeto + validação de env | — |
| 2 | Estrutura de pastas | 1 |
| 3 | Shared (erros, tipos, slug formatter) | 2 |
| 4 | Schema Prisma + migration | 1 *(paralelo ao 3)* |
| 5 | Domínio (entidade + interface repo) | 3, 4 |
| 6 | Infraestrutura (repo Prisma + storage + Multer config) | 4, 5 |
| 7 | Casos de uso (incluindo slug com unicidade) | 3, 5, 6 |
| 8 | Presentation (DTOs, controller, rotas) | 7 |
| 9 | Express app + error handler global | 8 |
| 10 | Testes manuais e ajustes | 9 |

---

## Princípio-guia

> As dependências sempre apontam para dentro: Presentation → Application → Domain ← Infrastructure.  
> O domínio não conhece ninguém. Todos conhecem o domínio.
