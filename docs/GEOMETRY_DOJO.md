# Geometria Analítica Dojo — prévia

Perfil dedicado dentro do fork real de [Kana Dojo](https://github.com/lingdojo/kana-dojo), preservando AGPL-3.0, componentes Button/MasteryBar, utilitários e o padrão features/Zustand. A implementação vive em `features/Geometry`; `geometry/app` é o ponto de entrada Next.js. O perfil não importa os provedores, analytics, instrumentação ou integrações do produto japonês. Dependências e lockfile da base foram preservados.

## Executar e verificar

```powershell
npm ci --no-audit --no-fund
npm run geometry:test
npm run geometry:check
npm run geometry:build
node scripts/serve-geometry.mjs
# Em outro terminal, para o GeoGebra local:
$env:GEOMETRY_PORT='3101'
node scripts/serve-geometry.mjs
```

Abra http://127.0.0.1:3100. Os artefatos são `geometry/out` e `geometry/visual-out`. O segundo contém exclusivamente construções e nenhuma interface de respostas. Para publicar, configure `NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN` com a URL imutável da prévia visual do projeto Pages dedicado `geometria-analitica-dojo`. O build aceita apenas esse projeto e a origem local de teste. A produção/main nunca precisa ser publicada. Não use o build principal do Kana Dojo para este produto.

## Conteúdo e limites

O catálogo preserva 30 IDs da Lista 1 e 49 da Lista 2. Os sete treinos completos são Lista 1 Q2/Q7 e Lista 2 Q1/Q4/Q15/Q16/Q30, revisados contra as fontes originais do handoff. Os outros 72 itens são consulta, com verificador pendente; figuras e transcrições tipográficas dessas consultas ainda requerem revisão contra os PDFs. Q5/Q49 da Lista 2 estão pendentes de fonte para parábolas.

O catálogo registra lista, questão, página, procedência e SHA-256 da fonte. Os originais permanecem no pacote privado `Geometria-Anal-tica-WebApp`, branch `docs/geometry-analitica-handoff`, commit `9f45ca563a2e2b64795ed4d484bfdc3b325cb6ea`. O estado pessoal e os PDFs não são publicados neste fork. Níveis históricos A/B/C/D não são importados nem atualizados automaticamente.

O parser cobre racionais exatos, decimais finitos de até seis casas, radicais reais, coordenadas e equações lineares em x/y. Há limites de tamanho, inteiros seguros e complexidade. Não executa código, não usa CAS externo e não aprova arredondamentos como igualdade exata. Produtos não lineares, denominadores com variáveis e funções gerais pedem esclarecimento. Formas gerais, reduzidas e ponto-inclinação e múltiplos não nulos representam a mesma reta. Provas são contratos de relações específicas com caminhos equivalentes; a reflexão em português orienta o tutor, mas não é certificada como prova matemática.

Somente entradas validadas/corrigidas viram premissas. Hidratação revalida a matemática persistida; revisão invalida dependentes. Resultados corretos sem evidência ficam calculados. Ambiguidade não registra erro. A primeira divergência e passos anteriores sobrevivem à correção e recarga. Falha de localStorage mantém a sessão em memória e avisa o usuário; limpar remove somente a chave deste app.

## GeoGebra e privacidade

Embedding oficial `deployggb.js`/`GGBApplet`, carregado por ação do aluno. O GeoGebra exige origem normal para seus frames GWT; por isso executa em uma prévia visual diferente da origem de estudo. Mesmo com `allow-same-origin` nesse frame isolado, a política de mesma origem impede acesso à página principal e seu localStorage. URLs carregam apenas IDs de atividade/etapa em fragmento, nunca respostas; o frame recebe documentos estáticos preparados no build. `postMessage` aceita somente status, conferindo origem e janela. A CSP principal permite conexões somente à própria origem; não existem endpoints de submissão, IA, sincronização, Sentry ou analytics no perfil.

GeoGebra recebe requisições normais de recursos e pode observar metadados de rede, mas não respostas ou ledger. Construções ocultam camadas até a validação e não mostram medidas finais. SVG descritivo e tutor permanecem se o applet falhar. Pontos dados são fixos; exploração permite zoom/pan, sem transformar a figura em autoridade matemática.

## Aceitação e validação

54 testes cobrem equivalência racional/radical e escalamento, sintaxe limitada, os sete treinos, erro local, ambiguidade, evidência pendente, dependências, hidratação adulterada, diagnóstico corrigido, limpeza/quota, falha do applet e isolamento. `geometry:check` executa TypeScript estrito e ESLint; `geometry:build` exporta o perfil Next.js.

AC-01 a AC-06 e AC-09/10/12 possuem testes determinísticos. AC-07/08 usam construções de pontos, segmentos, retas/interseção, alternativas e teste de falha; o carregamento real é conferido no navegador. AC-11 é conferido em viewport 390×844, teclado, foco, conclusão, recarga e limpeza. Esta prévia cobre sete treinos, não a verificação completa dos 79 exercícios.

## Licença e referências

Avisos e licença upstream preservados. A interface oferece a licença e código correspondente ao SHA do build, que precisa estar publicado no fork antes do deploy. Nenhum merge, alteração de acesso, domínio ou publicação de produção faz parte do fluxo.

- [GeoGebra embedding](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/)
- [GeoGebra Apps API](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/)
- [Next.js static export](https://nextjs.org/docs/app/guides/static-exports)
- [Cloudflare Pages para Next.js estático](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
- [Prévia e URLs imutáveis](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
