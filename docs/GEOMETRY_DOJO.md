# Geometria Analítica Dojo — prévia

Perfil dedicado dentro do fork real de [Kana Dojo](https://github.com/lingdojo/kana-dojo), preservando AGPL-3.0, componentes Button/MasteryBar, utilitários e o padrão features/Zustand. A implementação vive em `features/Geometry`; `geometry/app` é o ponto de entrada Next.js. O perfil não importa os provedores, analytics, instrumentação ou integrações do produto japonês. Dependências e lockfile da base foram preservados.

## Executar e verificar

```bash
npm ci --no-audit --no-fund
npm run geometry:test
npm run geometry:check
npm run geometry:build
node scripts/serve-geometry.mjs
# Em outro terminal, para o GeoGebra local:
GEOMETRY_PORT=3101 node scripts/serve-geometry.mjs
# Com os dois servidores prontos:
npm run geometry:browser
```

Abra http://127.0.0.1:3100. Os artefatos são `geometry/out` e `geometry/visual-out`. O segundo contém exclusivamente construções, sem interface de respostas. O servidor de verificação aplica os mesmos `_headers`/CSP do export. `geometry:browser` usa o Playwright existente e Chromium real, salva capturas e `report.json` em `geometry/browser-evidence` (ignorado pelo Git). Variáveis opcionais: `GEOMETRY_BASE_URL`, `GEOMETRY_EVIDENCE_DIR`, `GEOMETRY_CHROMIUM_PATH` e `GEOMETRY_BROWSER_PROXY`. O proxy herdado de `HTTPS_PROXY` atende recursos externos; localhost continua local.

A prévia autorizada é publicada pelo runner do Site Ops, que usa as credenciais Cloudflare existentes somente no GitHub Actions. Configure `NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN` com `https://geometry-visual.geometria-analitica-dojo-cmk.pages.dev`. O build aceita apenas o projeto dedicado e a origem local de teste; o visual deve diferir da origem de estudo. O runner fixa o SHA revisado e publica somente as branches de prévia. Não use o build principal do Kana Dojo para este produto.

## Figura e tutor

A resolução começa com DADOS, ALVO e uma figura ampla, com escala igual nos dois eixos. O ledger fica abaixo da construção. Em mobile, a ordem de leitura mantém a figura antes da ferramenta e dos campos algébricos. O tema violeta + lima usa fundo escuro para novas sessões e oferece uma variante clara em branco/lilás. O botão visível “Claro”/“Escuro” no cabeçalho troca o tema e salva a escolha localmente, preservando preferências anteriores e o ledger. O SVG semântico desenha vértices ativos, lado oposto, projeções, prolongamentos, marcas de congruência, quadrados e rótulos de 90°. Traços diferentes distinguem construções sem depender somente de cor; botões equivalentes permitem selecionar vértices/lados por teclado.

`GeometryDojo` organiza navegação e catálogo. `StudyWorkspace` atende os sete treinos originais; `AltitudeStudy` conduz a nova construção. `GeometryScene` e `lib/scene` cuidam da representação; `ConceptComparison` distingue mediana, altura e mediatriz. `RelationTutor` reconhece a relação antes de construir uma ferramenta, com reflexão aberta. `StepCalculation` recebe resultado e evidência. `StudyLedger`, tutor determinístico e store persistente continuam responsáveis por premissas e revisão.

A nova atividade `altura-ortocentro` usa A=(2,-1), B=(0,3), C=(1,2). O aluno seleciona C, reconhece AB como lado oposto e escolhe perpendicularidade; então traduz 90° por inclinações ou produto escalar. Repete por A/BC e resolve o sistema de duas alturas distintas. A conta aceita, entre outras formas, `x-2y+3=0`, `y=x/2+3/2`, `y-2=(1/2)(x-1)` para a primeira altura e `x-y-3=0`, `y=x-3` para a segunda. H=(9,6) precisa satisfazer ambas as retas validadas.

Antes dessa validação, a figura mostra somente trechos finitos das alturas, sem H ou retas completas que revelem a interseção. Depois, exibe o ortocentro externo e a conclusão. Confundir ponto médio com altura abre a comparação geométrica. O tutor distingue erros conceituais, algébricos, notacionais, de interpretação e de representação. Ambiguidade pede esclarecimento sem penalidade. Uma resposta correta sem evidência fica calculada, sem liberar premissas.

RESET remove tentativas/hints da etapa atual, preserva entradas validadas e a primeira divergência, e reorienta com dados, alvo, premissas e próximo passo. Revisar uma altura invalida o ortocentro e restaura a resposta anterior para edição. Recomeçar o treino e limpar os dados são ações separadas. Foco acompanha a próxima relação ou campo de cálculo; botões possuem altura mínima de 44px e campos usam ao menos 16px em mobile. Movimento reduzido é respeitado.

## Conteúdo e limites

O catálogo preserva 30 IDs da Lista 1 e 49 da Lista 2. Os sete treinos originais são Lista 1 Q2/Q7 e Lista 2 Q1/Q4/Q15/Q16/Q30, revisados contra as fontes do handoff. O novo estudo de alturas é explicitamente **Derivado**, separado dos 79 enunciados: o triângulo solicitado não consta dessas listas. Há oito treinos completos; os outros 72 itens são consulta, com verificador pendente. Figuras e transcrições tipográficas dessas consultas ainda requerem revisão contra os PDFs. Q5/Q49 da Lista 2 permanecem pendentes de fonte para parábolas.

O catálogo registra lista, questão, página, procedência e SHA-256 da fonte. Os originais permanecem no pacote privado `Geometria-Anal-tica-WebApp`, branch `docs/geometry-analitica-handoff`, commit `9f45ca563a2e2b64795ed4d484bfdc3b325cb6ea`. O estado pessoal e os PDFs não são publicados neste fork. Níveis históricos A/B/C/D não são importados nem atualizados automaticamente.

O parser cobre racionais exatos, decimais finitos de até seis casas, radicais reais, coordenadas e equações lineares em x/y. Há limites de tamanho, inteiros seguros e complexidade. Não executa código, não usa CAS externo e não aprova arredondamentos como igualdade exata. Produtos não lineares, denominadores com variáveis e funções gerais pedem esclarecimento. Formas gerais, reduzidas, ponto-inclinação e múltiplos não nulos representam a mesma reta. Provas têm contratos de relações específicas com caminhos equivalentes; a reflexão em português orienta o tutor, mas não é certificada como prova matemática.

Somente entradas validadas/corrigidas viram premissas. Hidratação revalida a matemática persistida; revisão invalida dependentes. A primeira divergência e passos anteriores sobrevivem à correção e recarga. Falha de localStorage mantém a sessão em memória e avisa o usuário; limpar remove somente a chave `geometria-dojo-v1`.

## GeoGebra e privacidade

Embedding oficial `deployggb.js`/`GGBApplet`, carregado por ação do aluno na própria área da figura. Até ficar pronto, o SVG continua visível; falha de rede ou timeout mantém diagrama e resolução. Há zoom, reinicialização e retorno ao visual estático. A exploração da atividade derivada permite arrastar A/B/C e recalcula projeções e ângulos retos nativos. Alterar essa exploração não altera os dados do enunciado nem o ledger. Os treinos originais mantêm seus pontos dados fixos.

A comparação didática entre mediana, altura e mediatriz oferece o botão “Arrastar pontos no GeoGebra”, disponível antes da conta. As três cenas permitem mover A/B/C: a mediana termina em `Midpoint(A,B)` com marcas nativas iguais em AM/MB; a altura usa perpendicular e interseção para encontrar F; a mediatriz passa por M e mantém 90°. As relações atualizam inclusive com AB vertical ou horizontal. Pontos coincidentes ou alinhados produzem um aviso dentro da exploração; afastá-los recupera a construção. Trocar o modo ou reiniciar restaura o triângulo de exemplo. A comparação não libera resultados do treino, não produz H e não escreve no ledger. O SVG semântico correspondente permanece disponível durante carregamento e falhas de rede.

O GeoGebra exige origem normal para seus frames GWT; por isso executa em uma prévia visual diferente da origem de estudo. Mesmo com `allow-same-origin` no frame isolado, a política de mesma origem impede acesso à página principal e seu localStorage. URLs carregam somente IDs de atividade/etapa em fragmento, nunca respostas; os documentos são preparados a partir de dados autorais no build. `postMessage` aceita somente status, conferindo origem e janela. A CSP principal permite conexões somente à própria origem; não existem endpoints de submissão, IA, sincronização, Sentry ou analytics no perfil.

GeoGebra recebe requisições normais de recursos e pode observar metadados de rede, sem receber respostas ou ledger. A exploração não certifica a matemática. Construções são liberadas por estágios validados; H aparece somente depois da prova da interseção. Escala isotrópica e redimensionamento do applet foram conferidos em Chromium desktop e mobile, inclusive depois de reduzir a janela.

## Aceitação, evidências e licença

A suíte inclui os 54 testes anteriores e regressões de cena, pedagogia, alturas, reset, estado persistido e GeoGebra. [GEOMETRY_VERIFICATION.md](GEOMETRY_VERIFICATION.md) registra contagens, jornadas, gates, evidências e limites reais. `geometry:check` executa TypeScript estrito e ESLint; `geometry:build` exporta o perfil Next.js e registra o SHA em `deployment-info.json`. O teste de navegador lê esse manifesto e informa qual build verificou.

Avisos e licença upstream preservados. A interface oferece a licença e código correspondente ao SHA do build, que precisa estar publicado no fork antes do deploy. Nenhum merge, alteração de acesso, domínio ou publicação de produção faz parte deste fluxo.

- [GeoGebra embedding](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/)
- [GeoGebra Apps API](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/)
- [Next.js static export](https://nextjs.org/docs/app/guides/static-exports)
- [Cloudflare Pages para Next.js estático](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
- [Prévia e URLs imutáveis](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
