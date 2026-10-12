import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import SearchBar from '@theme/SearchBar';

const sections = [
  ['01', 'Primeiros passos', 'Configure a clínica, os serviços e os horários de atendimento.', 'primeiros-passos', 'Começar a configuração'],
  ['02', 'Equipe e acessos', 'Convide sua equipe e saiba como confirmar o acesso à clínica.', 'equipe', 'Organizar a equipe'],
  ['03', 'WhatsApp e Instagram', 'Conecte os canais da clínica e acompanhe o status das integrações.', 'whatsapp', 'Conectar os canais'],
  ['04', 'Atendimento', 'Encontre conversas, escolha responsáveis e organize as etapas.', 'conversas', 'Conhecer o atendimento'],
  ['05', 'Agenda e tarefas', 'Organize consultas e acompanhe as pendências do dia a dia.', 'agenda', 'Planejar a rotina'],
  ['06', 'IA e acompanhamento', 'Configure as respostas da IA e as regras de retomada de contatos.', 'inteligencia-artificial', 'Configurar a automação'],
];
export default function Home() {
  return <Layout title="Central de ajuda" description="Guias do Atenclin: primeiros passos, equipe, WhatsApp, Instagram, agenda, tarefas e inteligência artificial.">
    <main className="help-home">
      <header className="help-hero">
        <span className="help-kicker">CENTRAL DE AJUDA ATENCLIN</span>
        <h1>Como podemos ajudar?</h1>
        <p>Do primeiro acesso à rotina da clínica.<br/>Encontre o próximo passo, sem complicação.</p>
        <div className="hero-search"><SearchBar /></div>
        <div className="help-shortcuts"><span>Acesso rápido:</span><Link to="/artigos/whatsapp">Conectar WhatsApp</Link><Link to="/artigos/aceitar-convite">Aceitar um convite</Link></div>
      </header>
      <section className="help-topics" aria-labelledby="topics-title">
        <div className="topics-heading"><div><span className="help-kicker">EXPLORE POR ASSUNTO</span><h2 id="topics-title">Ajuda para cada etapa</h2></div><p>Guias práticos para usar o Atenclin.</p></div>
        <div className="topic-grid">{sections.map(([number, title, text, slug, action]) => <Link className="topic-card" key={slug} to={`/artigos/${slug}`}><span className="topic-number">{number}</span><h3>{title}</h3><p>{text}</p><span className="topic-action">{action} <span aria-hidden="true">↗</span></span></Link>)}</div>
      </section>
      <section className="help-troubleshooting"><div><h2>Algo não saiu como esperado?</h2><p>Veja o que conferir quando um convite, uma conexão ou um envio não funciona.</p></div><Link className="button button--primary" to="/artigos/problemas-comuns">Resolver um problema →</Link></section>
    </main>
  </Layout>;
}
