import React, { useRef } from "react";

const PALETTE = [
  { name: "navy", hex: "#0f3b59", use: "Info e detalhes azuis", light: false },
  {
    name: "steel",
    hex: "#88b8ce",
    use: "Fitinha, detalhes",
    light: true,
  },
  { name: "sky", hex: "#c8dafb", use: "Badge azul, fitinha", light: true },
  { name: "sun", hex: "#eebb48", use: "Ação principal, destaque", light: true },
  { name: "cream", hex: "#fefaf0", use: "Fundo da página", light: true },
  {
    name: "brown",
    hex: "#3f1d12",
    use: "Header, rodapé, títulos, texto, foco",
    light: false,
  },
  {
    name: "clay",
    hex: "#a13a1e",
    use: "Erro, perigo, marcadores",
    light: false,
  },
];

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="stack" style={{ marginBottom: "var(--space-12)" }}>
      <h2>{title}</h2>
      <div className="brand-line" />
      {children}
    </div>
  );
}

export function DesignSystem(): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div
      className="container"
      style={{ paddingTop: "6rem", paddingBottom: "4rem" }}
    >
      <header className="stack" style={{ marginBottom: "var(--space-12)" }}>
        <h1 className="gradient-text">Design System — Sol da Bahia</h1>
        <p>
          Um café da tarde para quem gosta de criar software. Todos os elementos
          HTML abaixo já nascem estilizados pelo <code>index.css</code>: basta
          usar a tag certa.
        </p>
      </header>

      <Block title="Paleta">
        <div className="row">
          {PALETTE.map((c) => (
            <div
              key={c.name}
              style={{
                width: 150,
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: `var(--${c.name})`,
                color: c.light ? "var(--brown)" : "var(--cream)",
              }}
            >
              <strong style={{ color: "inherit" }}>{c.name}</strong>
              <br />
              <small style={{ color: "inherit" }}>{c.hex}</small>
              <br />
              <small style={{ color: "inherit" }}>{c.use}</small>
            </div>
          ))}
        </div>
        <p>
          Proporção: ~60% creme e areia · 25% marrom café · 10% amarelo · 5%
          azul. O header usa <code>--brown</code> com detalhes em{" "}
          <code>--sun</code>.
        </p>
      </Block>

      <Block title="Tipografia">
        <h1>Título 1 — Bahia Open Source</h1>
        <h2>Título 2 — Comunidade</h2>
        <h3>Título 3 — Projetos</h3>
        <h4>Título 4 — Eventos</h4>
        <h5>Título 5 — Notícias</h5>
        <h6>Título 6 — Rodapé</h6>
        <p>
          Parágrafo com <strong>negrito</strong>, <em>itálico</em>,{" "}
          <mark>texto marcado</mark>, <del>removido</del>, <ins>inserido</ins>,{" "}
          <abbr title="Software Livre">SL</abbr>, H<sub>2</sub>O, x<sup>2</sup>{" "}
          e um <a href="#links">link no texto</a>.
        </p>
        <p>
          <small>Texto pequeno para legendas e observações.</small>
        </p>
        <blockquote>
          O código é uma forma de expressão e transformação social.
          <footer>
            — <cite>Comunidade Open Source Bahia</cite>
          </footer>
        </blockquote>
        <hr />
      </Block>

      <Block title="Código">
        <p>
          Use <code>npm run dev</code> e pressione <kbd>Ctrl</kbd> +{" "}
          <kbd>C</kbd> para parar.
        </p>
        <pre>
          <code>{`function saudar(nome: string) {\n  return \`Oxente, \${nome}!\`;\n}`}</code>
        </pre>
      </Block>

      <Block title="Listas">
        <div className="grid">
          <div>
            <h4>Não ordenada</h4>
            <ul>
              <li>React 19</li>
              <li>
                Supabase
                <ul>
                  <li>Auth</li>
                  <li>Storage</li>
                </ul>
              </li>
              <li>Tailwind v4</li>
            </ul>
          </div>
          <div>
            <h4>Ordenada</h4>
            <ol>
              <li>Criar conta</li>
              <li>Completar perfil</li>
              <li>Publicar no fórum</li>
            </ol>
          </div>
          <div>
            <h4>Definição</h4>
            <dl>
              <dt>Feira de Santana</dt>
              <dd>Nossa sede</dd>
              <dt>Discord</dt>
              <dd>Ponto de encontro</dd>
            </dl>
          </div>
          <div>
            <h4>Grupo</h4>
            <ul className="list-group">
              <li>
                Publicações <span className="badge badge-sun">12</span>
              </li>
              <li>
                Comentários <span className="badge badge-blue">34</span>
              </li>
              <li>
                Denúncias <span className="badge badge-danger">0</span>
              </li>
            </ul>
          </div>
        </div>
      </Block>

      <Block title="Botões">
        <div className="row">
          <button className="btn btn-primary">Primário</button>
          <button className="btn btn-secondary">Secundário</button>
          <button className="btn btn-dark">Café</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Perigo</button>
          <button className="btn btn-primary" disabled>
            Desabilitado
          </button>
        </div>
        <div className="row">
          <button className="btn btn-primary btn-sm">Pequeno</button>
          <button className="btn btn-primary">Médio</button>
          <button className="btn btn-primary btn-lg">Grande</button>
          <span className="btn-group">
            <button className="btn btn-secondary">Dia</button>
            <button className="btn btn-secondary">Semana</button>
            <button className="btn btn-secondary">Mês</button>
          </span>
        </div>
      </Block>

      <Block title="Formulários">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="ds-nome">Nome</label>
            <input id="ds-nome" type="text" placeholder="ex: Maria da Bahia" />
            <span className="hint">Como você aparece na comunidade.</span>
          </div>
          <div className="field">
            <label htmlFor="ds-email">E-mail inválido</label>
            <input id="ds-email" type="email" defaultValue="isso-nao-e-email" />
            <span className="error-text">Informe um e-mail válido.</span>
          </div>
          <div className="grid">
            <div className="field">
              <label htmlFor="ds-cat">Categoria</label>
              <select id="ds-cat" defaultValue="discussao">
                <option value="discussao">Discussão</option>
                <option value="projetos">Projetos</option>
                <option value="duvidas">Dúvidas</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="ds-off">Desabilitado</label>
              <input
                id="ds-off"
                type="text"
                defaultValue="Somente leitura"
                disabled
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="ds-msg">Mensagem</label>
            <textarea id="ds-msg" placeholder="No que você está pensando?" />
          </div>
          <fieldset>
            <legend>Preferências</legend>
            <label className="option">
              <input type="checkbox" defaultChecked /> Receber novidades
            </label>
            <label className="option">
              <input type="radio" name="ds-r" defaultChecked /> Presencial
            </label>
            <label className="option">
              <input type="radio" name="ds-r" /> Online
            </label>
            <label className="option">
              <input type="checkbox" role="switch" defaultChecked /> Modo
              notificações
            </label>
            <input type="range" aria-label="Volume" />
            <input type="file" aria-label="Arquivo" />
            <input type="color" defaultValue="#eebb48" aria-label="Cor" />
          </fieldset>
          <div className="row">
            <button type="submit" className="btn btn-primary">
              Enviar
            </button>
            <button type="reset" className="btn btn-ghost">
              Limpar
            </button>
          </div>
        </form>
      </Block>

      <Block title="Feedback">
        <div className="alert alert-info">
          <strong>Info</strong>Encontro da comunidade neste sábado.
        </div>
        <div className="alert alert-success">
          <strong>Sucesso</strong>Publicação criada.
        </div>
        <div className="alert alert-warning">
          <strong>Atenção</strong>Seu perfil está incompleto.
        </div>
        <div className="alert alert-danger">
          <strong>Erro</strong>Não foi possível salvar.
        </div>
        <div className="row">
          <span className="badge badge-blue">Azul</span>
          <span className="badge badge-green">Verde</span>
          <span className="badge badge-sun">Sol</span>
          <span className="badge badge-danger">Perigo</span>
          <span className="tag">#opensource</span>
          <span className="tag">#bahia</span>
        </div>
        <progress value={65} max={100} aria-label="Progresso" />
        <meter value={0.4} aria-label="Medidor" />
      </Block>

      <Block title="Cards e avatares">
        <div className="grid">
          <article className="card">
            <h4>Card simples</h4>
            <p>Superfície creme com borda quente e sombra suave.</p>
            <footer>
              <small>Rodapé do card</small>
            </footer>
          </article>
          <a href="#cards" className="card is-interactive">
            <h4>Card interativo</h4>
            <p>Sobe levemente e destaca a borda no hover.</p>
          </a>
          <div
            className="surface surface--warm"
            style={{ padding: "var(--space-5)" }}
          >
            <h4>Surface quente</h4>
            <p>Brilho amarelo no hover.</p>
          </div>
        </div>
        <div className="avatar-group">
          <span className="avatar">AF</span>
          <span className="avatar">BS</span>
          <span className="avatar">CM</span>
          <span className="avatar">+9</span>
        </div>
      </Block>

      <Block title="Tabela">
        <div className="table-wrap">
          <table>
            <caption>Projetos da comunidade</caption>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Tag</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Docs Bahia</td>
                <td>Docs</td>
                <td>
                  <span className="badge badge-sun">Em desenvolvimento</span>
                </td>
              </tr>
              <tr>
                <td>Comunidade Discord</td>
                <td>Community</td>
                <td>
                  <span className="badge badge-green">Estável</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Block>

      <Block title="Navegação">
        <ul className="breadcrumb">
          <li>
            <a href="#nav">Início</a>
          </li>
          <li>
            <a href="#nav">Fórum</a>
          </li>
          <li aria-current="page">Publicação</li>
        </ul>
        <div className="tabs">
          <button className="tab active">Publicações</button>
          <button className="tab">Comentários</button>
          <button className="tab">Salvos</button>
        </div>
        <ul className="pagination">
          <li>
            <a href="#nav">‹</a>
          </li>
          <li>
            <a href="#nav" aria-current="page">
              1
            </a>
          </li>
          <li>
            <a href="#nav">2</a>
          </li>
          <li>
            <a href="#nav">3</a>
          </li>
          <li>
            <a href="#nav">›</a>
          </li>
        </ul>
      </Block>

      <Block title="Acordeão e diálogo">
        <div>
          <details open>
            <summary>O que é o Open Source Bahia?</summary>
            <p>Uma comunidade de software livre baseada em Feira de Santana.</p>
          </details>
          <details>
            <summary>Como contribuir?</summary>
            <p>Entre no Discord e escolha um projeto.</p>
          </details>
        </div>
        <div className="row">
          <button
            className="btn btn-secondary"
            onClick={() => dialogRef.current?.showModal()}
          >
            Abrir diálogo
          </button>
        </div>
        <dialog ref={dialogRef}>
          <form method="dialog">
            <h3>Tem certeza?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="row">
              <button className="btn btn-danger">Excluir</button>
              <button className="btn btn-ghost">Cancelar</button>
            </div>
          </form>
        </dialog>
      </Block>

      <Block title="Mídia">
        <figure>
          <img
            src="/bg-auth.png"
            alt="Ilustração da comunidade"
            style={{ maxHeight: 220, objectFit: "cover" }}
          />
          <figcaption>
            <small>Figura com legenda.</small>
          </figcaption>
        </figure>
      </Block>
    </div>
  );
}
