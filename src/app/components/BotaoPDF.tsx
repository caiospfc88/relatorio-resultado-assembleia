"use client"; // Necessário para Next.js no frontend
import { useState, useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configura as fontes para o pdfMake
pdfMake.vfs = pdfFonts.vfs;

export function formatarDataPtBr(data: string) {
  var ano = data.substring(0,4),
    dia  = data.substring(8,10),
    mes  = data.substring(5,7);
   return  [dia, mes, ano].join("/");
}

export default function BotaoPDF() {

  let today = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // Carrega o arquivo JSON de maneira assíncrona
        const loadData = async () => {
          const result = await import("../result.json");
          setData(result.default);
        };
        
        // Carrega a imagem como base64
        const loadImage = async () => {
            const image = await fetch('/logo.jpg');
            const imageBlob = await image.blob();
            const imageBase64 = await convertBlobToBase64(imageBlob);
            setLogoImage(imageBase64);
        };

        loadData();
        loadImage();
    }, []);

    const convertBlobToBase64 = (blob: Blob) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    function gerarPDF() {
        if (!logoImage) {
            alert("A imagem não foi carregada corretamente.");
            return;
        }

        const content = [{
            columns: [
              {
                image: logoImage,
                width: 140,
                margin: [0, 0, 0, 10],
                alignment: "left",
              },
              {
                text: "RESULTADO DE ASSEMBLEIA",
                fontSize: 16,
                style: "header",
                width: 260,
                margin: [10, 10, 0, 0],
              },
              {
                text: `DATA: ${today}`,
                fontSize: 8,
                margin: [0, 8, 0, 0],
              }
            ],
            columnGap: 12,
          }
        ];
    
        const docDefinition = {
          content: [
            {
              columns: [
                {
                  image: logoImage,
                  width: 140,
                  margin: [0, 0, 0, 20],
                  alignment: "left",
                },
                {
                  text: "RESULTADO DE ASSEMBLEIA",
                  fontSize: 16,
                  style: "header",
                  width: 260,
                  margin: [10, 10, 0, 0],
                },
                {
                  text: `DATA: ${today}`,
                  fontSize: 8,
                  margin: [0, 8, 0, 0],
                }
              ],
              columnGap: 12,
            }
          ],
          pageMargins: [25, 15, 25, 40], // Ajusta margem inferior para o footer
              footer: function () {
                return {
                  margin: [25, 5, 15, 0], // Ajusta a posição do rodapé
                  layout: "noBorders",
                  table: {
                    widths: ["100%"],
                    body: [
                      [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 540, y2: 0, lineWidth: 1 }] }], // Linha superior
                      [{ text: `Groscon Administradora de Consórcios LTDA`, alignment: "right", margin: [0, 5, 15, 0], fontSize: 8 }],
                    ],
                  },
                };
              },
        };
        
        data.forEach(assembleia => {
          // Para cada assembleia, itere sobre os grupos
          assembleia.grupos.forEach((grupo, indexGrupo) => {        
            // Cria o cabeçalho da tabela
            const tableBody = [
              [
                { text: `Grupo ${grupo.codigoGrupo}`, style: 'tableHeader' },
                { text: 'Quantidade', style: 'tableHeader' },
                { text: 'Contemplados', style: 'tableHeader' },
                { text: `Assembleia ${formatarDataPtBr(assembleia.dataAssembleia)}`, style: 'tableHeader' }
              ]
            ];
        
            // Para cada tipo de lance, crie uma linha na tabela
            grupo.tiposLance.forEach(tipo => {
              // Quantidade de lances para esse tipo
              const quantidade = tipo.lances.length;
        
              // Concatena as informações de "Contemplados" e "Assembleia"
              let contemplados = '';
              let vendedores = '';
        
              tipo.lances.forEach((lance, index) => {
                index + 1 < 10 ? 
                // Cria uma linha para "Contemplados": Número de ordem, código da cota e percentual
                contemplados += `${index + 1}º\u00A0 - ${lance.percentualLance.toFixed(4)} %\n`
                :
                contemplados += `${index + 1}º - ${lance.percentualLance.toFixed(4)} %\n`;
        
                // Para "Assembleia": adiciona o vendedor (se existir)
                if (lance.codigoRepresentante) {
                  vendedores += `Vendedor: ${lance.codigoRepresentante}\n`;
                }
              });
        
              // Adiciona uma linha para esse tipo de lance na tabela
              tableBody.push([
                { text: tipo.tipoLance, alignment: 'center', margin: [0, quantidade*6, 0, quantidade*6] },
                { text: quantidade.toString(), alignment: 'center', margin: [0, quantidade*6, 0, quantidade*6] },
                { text: contemplados, alignment: 'center', margin: [0, 5, 0, 5] },
                { text: vendedores, alignment: 'center', margin: [0, 5, 0, 5] }
              ]);
            });

            // Cria o objeto da tabela
            const tableObj = {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', '*', '*'], // ajuste as larguras conforme necessário
                body: tableBody
              },
              layout: {
                // Linhas horizontais apenas no topo e na base
                hLineWidth: function(i, node) {
                  return (i === 0 || i === node.table.body.length) ? 1 : 0.3; // Primeira e última linha mais grossa
                },
                // Linhas verticais apenas nas laterais
                vLineWidth: function(i, node) {
                  return (i === 0 || i === node.table.widths.length) ? 1 : 0; // Apenas laterais
                },
                // Cor das linhas horizontais
                hLineColor: function(i, node) {
                  return 'black'; 
                },
                // Cor das linhas verticais
                vLineColor: function(i, node) {
                  return 'black'; 
                },
                // Define o espaçamento interno das células
                paddingLeft: function(i, node) { return 4; },
                paddingRight: function(i, node) { return 4; },
                paddingTop: function(i, node) { return 2; },
                paddingBottom: function(i, node) { return 2; }
              },
              margin: [0, 0, 0, 20],
            }
            // Se não for o primeiro grupo, adiciona quebra de página antes da tabela
            if (indexGrupo > 0) {
              tableObj.pageBreak = 'before';
            }
                
            // Adiciona a tabela no conteúdo do PDF
            docDefinition.content.push(tableObj);
          });
        });
        
        // Exemplo de estilos (opcional)
        docDefinition.styles = {
          header: {
            fontSize: 14,
            bold: true
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'white',
            fillColor: '#133483',
            alignment: 'center'
          }
        };
    
        pdfMake.createPdf(docDefinition).download("relatorio_assembleia.pdf");
      }

  return (
    <button
      onClick={gerarPDF}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#035191",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "15px"
      }}
    >
      Baixar PDF
    </button>
  );
}
