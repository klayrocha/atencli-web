---
title: "Configurar o acompanhamento automático"
description: "Defina regras para retomar contatos e acompanhe as execuções."
last_update:
  date: 2026-10-12
---

## Entenda os modelos
Cada modelo representa uma situação de retomada, como interesse sem agendamento ou confirmação de consulta. A execução depende do contexto do contato, das regras configuradas e da disponibilidade do canal.

## Configure um modelo
1. Abra **Acompanhamento automático**.
2. Na aba de modelos, selecione a situação desejada.
3. Ajuste o tempo de espera antes do primeiro envio.
4. Escolha o máximo de mensagens e o intervalo entre tentativas.
5. Defina a janela diária e os dias ativos.
6. Revise as mensagens e, quando disponível, a configuração de modelo do WhatsApp.
7. Salve as alterações e confira se o modelo deve ficar ativo ou pausado.

Se o tempo de espera terminar fora da janela diária configurada, o envio fica sujeito ao próximo horário permitido. Ativar um modelo não garante envio imediato.

## Acompanhe as execuções
Abra a aba de execuções, aplique os filtros e confira status e tentativas. Use as ações de pausa, retomada ou cancelamento quando estiverem disponíveis para aquela execução.

## Uma mensagem não foi enviada
Confira a conexão do canal, a janela de envio, os dias ativos e o motivo informado na execução. Quando o canal exigir um modelo aprovado ou uma interação recente, siga a orientação da integração; repetir a tentativa sem corrigir a causa pode não resolver.

Alguns modelos podem gerar uma tarefa ao encerrar sem resposta ou com falha. Confira **Tarefas** para verificar pendências humanas relacionadas.

## Veja também
[WhatsApp](./whatsapp.md) · [Instagram](./instagram.md) · [Tarefas](./tarefas.md)
