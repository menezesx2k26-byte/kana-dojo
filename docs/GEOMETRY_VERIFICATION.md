# Verificação do takeover visual

Execução no repositório canônico `menezesx2k26-byte/kana-dojo`, branch `feat/geometria-analitica-dojo`. HEAD inicial reconciliado com a origem: `bd6d179d98ef913358cf73bf24c428dd892a3ec7`. Main inicial: `98266cab578d10f6d4fe37aebe2b993c6069dd4c`; branch inicialmente três commits à frente. Implementação feita no repo canônico; o clone de handoff foi usado somente para fontes/instruções. Nenhum merge em main ou alteração de domínio/acesso/produção.

## Gates e commits

| Gate                     | Commit      | Evidência                                                                                                       |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------- |
| 0 — reconciliação        | `40181eae6` | Fontes e estado inicial inspecionados; 54 testes, check e build verdes; screenshot de baseline.                 |
| 1 — base visual          | `5e51cc201` | Workspace/ledger extraídos, figura primeiro, temas claro/escuro, desktop/mobile.                                |
| 2 — cena semântica       | `3115a5b22` | Escala isotrópica, projeção, prolongamento, marcas geométricas e controles acessíveis.                          |
| 3 — comparação           | `f577404c7` | Mediana/meio, altura/90°, mediatriz/meio+90°; três estados nos dois tamanhos.                                   |
| 4 — alturas/ortocentro   | `1b2470060` | Exercício derivado completo, equivalência exata, evidências e revelação progressiva.                            |
| 4 — correção visual      | `df23bf981` | Removida sobreposição de canvas/ledger observada ao rolar a conclusão.                                          |
| 5 — integração           | `fb252e972` | Relação antes da ferramenta nos sete treinos originais; diagnóstico e RESET por camada.                         |
| 6 — GeoGebra             | `198db5f1c` | Carregamento real, construção dinâmica, isolamento, fallback e resize desktop→mobile.                           |
| 8 — revisão e regressões | `88a40a1c4` | IDs herdados rejeitados na hidratação; mensagens de Q15/Q30 usam ponto e reta.                                  |
| 7 — polimento            | `228b65b96` | Foco depois da validação, reflexão nova por altura, reinício sem draft antigo, controles ≥44px e ícone próprio. |

Os commits seguintes fecham a revisão independente e a regressão/documentação do gate 8. O HEAD final é identificado pelo histórico da branch e pelo `sourceSha` do manifesto e do relatório de navegador gerados a partir do commit final. Isso evita documentar um SHA fictício ou circular dentro do próprio commit.

## Verificação determinística

Baseline: 54 testes. Após os gates 1–7: 78 testes em 10 arquivos, todos verdes. O motor `lib/math.ts`, o catálogo original de 79 perguntas e o lockfile não foram alterados. Testes anteriores foram mantidos; a regra de fonte passou a aceitar somente a nova derivação explicitamente identificada, sem retirar exigência de fonte dos exercícios originais.

```bash
npm run geometry:test
npm run geometry:check
npm run geometry:build
npm run geometry:browser
```

`geometry:check` combina `tsc --noEmit -p geometry/tsconfig.json` e ESLint. O hook dos commits também executou o TypeScript global do repo. `geometry:build` gera export estático Next.js e os documentos autorais isolados do GeoGebra. A revisão final acrescentou três testes de IDs herdados na hidratação e dois de contexto geométrico em Q15/Q30. **Total final: 83 testes em 10 arquivos, todos verdes.** A suíte geral do produto japonês não foi executada; a validação cobre o perfil dedicado e seu typecheck global.

## Chromium real sobre o export de produção

Viewports: desktop 1440×1000 e mobile 390×844. Servidores locais nas portas 3100 e 3101 aplicam os `_headers`/CSP do export. Movimento reduzido é habilitado no teste. Evidências da execução ficam em `/workspace/geometry-evidence`; o script também pode produzir o mesmo pacote em `geometry/browser-evidence` usando o comando documentado. `report.json` associa o build ao seu SHA e registra erros de página, console, rede externa e capturas.

- Alturas nos dois viewports: selecionar vértice/lado; confusão de ponto médio; comparação visual; mediana incorreta `x=1`; resposta equivalente correta sem evidência; validação por inclinações; RESET preservando a primeira altura; segunda altura; confusão de três alturas; H=(9;6); conclusão; recarga; revisão de A restaurando a equação e ocultando H; limpeza local.
- Recuperação de persistência adulterada em mobile: `__proto__`, `constructor` e `toString` como seleção/ID de sessão são descartados, sem crash ou liberação de H.
- Sete fontes completas em mobile: Lista 1 Q2/Q7; Lista 2 Q1/Q4/Q15/Q16/Q30. Q16 também exercita confusão de mediatriz com construção por vértice.
- Temas claro/escuro, ordem da figura, seleção por Enter, foco em resultado e próxima relação, controles ≥44px, campos ≥16px, ausência de overflow, ausência de sobreposição canvas/ledger e colisões entre rótulos de texto SVG.
- GeoGebra real no desktop, seguido de resize a 390×844; applet reiniciado e retorno ao SVG. Falha de rede forçada nos dois tamanhos mantém o SVG e permite iniciar a próxima conta.

Doze jornadas de navegador (duas de alturas, sete fontes e três recuperações de persistência), mais os dois ensaios de GeoGebra. 32 capturas cobrem os oito estados mínimos do takeover e os temas/GeoGebra. Exemplos de arquivos: `initial-light-desktop.png`, `initial-dark-mobile.png`, `opposite-side-mobile.png`, `perpendicular-c-mobile.png`, `mediana-mobile.png`, `altura-mobile.png`, `mediatriz-mobile.png`, `first-height-mobile.png`, `completed-light-mobile.png`, `ledger-completed-mobile.png`, `geogebra-real-desktop.png`, `geogebra-real-mobile.png`, `geogebra-fallback-mobile.png`. Imagens foram inspecionadas visualmente; os testes também comparam caixas dos rótulos. A inspeção de teclado foi em Chromium emulado, sem teclado Android físico.

## GeoGebra e rede

O applet oficial realmente carregou: API disponível, sem falhas de página/rede. Na exploração de uma altura validada, mover C de (1,2) para (1.8,2.8) alterou a abscissa do pé de 0.6 para 0.44, com ângulo nativo π/2. H continuou ausente e o texto do ledger permaneceu igual. Acesso do frame a `parent.localStorage` e ao documento principal foi bloqueado pela política de mesma origem. Requisições externas observadas foram GETs de recursos oficiais; não houve envio das respostas. Reiniciar restaura C=(1,2).

O ensaio de indisponibilidade aborta deliberadamente o recurso oficial. Essa única falha de rede e seu console `ERR_FAILED` são esperados; não houve erro de página. O diagrama, o ledger e a resolução continuam disponíveis. A revisão do estado do applet impede que o status ready de uma etapa anterior esconda o fallback enquanto uma nova construção carrega.

## Decisões e limites

- O triângulo solicitado está ausente das duas listas originais: foi adicionado como estudo **Derivado**, fora dos 79 IDs. Custo se a classificação estiver errada: corrigir a referência, sem renumerar questões.
- A ordem explícita do takeover para feature branch e `geometry:build` prevaleceu sobre instruções genéricas da raiz para main/build principal. Custo se interpretada erradamente: rever o fluxo de entrega; nenhuma main foi alterada.
- H e as retas completas só aparecem depois de validar a interseção. Projeções finitas ensinam a altura antes disso, inclusive com pé fora do lado. O desenho é apoio pedagógico, sem autoridade sobre a prova.
- A revisão classificou a mensagem de Q15/Q30 como Minor; foi tratada como Important porque sua referência a vértice/lado oposto ensinava uma condição alheia ao enunciado. Dois testes falharam antes da correção e passaram depois; custo se a reclassificação estiver errada: esforço adicional de correção, sem perda dos contratos matemáticos.
- Os 72 itens sem verificador continuam como consulta; parábolas continuam pendentes de fonte. Reflexões abertas não recebem certificação semântica automática, e níveis A/B/C/D não são promovidos automaticamente.
- Teste mobile é emulação Chromium 390×844. Não foi feito ensaio em aparelho Android físico ou leitores de tela reais.

## Revisão independente

Revisor com contexto novo, gpt-6-astra, sobre todos os gates de produto: nenhuma finding Critical; uma Important e uma Minor (reclassificada Important). O crash por IDs herdados e o contexto incorreto de perpendicularidade foram reproduzidos por regressões antes da correção. A suíte completa passou 83/83 depois. O revisor também executou 29 testes focados e ensaios Chromium de revisão repetida, RESET/reload, respostas adulteradas e drafts pendentes; não encontrou outro defeito importante. Não há minor adiado.

## Publicação da branch

O transporte Git HTTPS retornou falha de autenticação, inclusive com o helper da conexão. A API GitHub confirmou permissão de escrita e aceitou os blobs autorizados. A entrega pela API Git reconstrói blobs, árvores e commits locais com autores/datas preservados, exige igualdade de cada SHA, e move exclusivamente `feat/geometria-analitica-dojo` com `force=false`. O histórico por gate permanece íntegro. O relatório final e os manifestos informam o SHA entregue; main não participa dessa atualização.

## Prévia Cloudflare

Bloqueio de deploy: este ambiente conectado possui rede, mas nenhum secret, variável de runtime ou identidade de saída configurados para Cloudflare; não há conexão Cloudflare callable, token ou sessão CLI exposta. Consulta de segredos de GitHub Actions no repo retornou 403 para a integração. Repositórios de infraestrutura referidos no handoff foram inspecionados para configuração relevante; projetos de outros produtos não foram alterados.

Projeto dedicado referido pelo handoff: `geometria-analitica-dojo`. Sua existência e estado atuais não puderam ser consultados na conta. URL de prévia e SHA implantado: **indisponíveis; nenhum deploy foi realizado nesta execução**. Código, export e testes foram concluídos independentemente desse acesso. Não foi criado projeto duplicado nem hospedagem alternativa; main, produção e DNS permanecem sem alterações.
