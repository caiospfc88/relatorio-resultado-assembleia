"use client";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function formatarDataPtBr(data: string) {
  const ano = data.substring(0, 4);
  const mes = data.substring(5, 7);
  const dia = data.substring(8, 10);
  return `${dia}/${mes}/${ano}`;
}

export default function BotaoPDF_P() {
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const today = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  useEffect(() => {
    // Carrega o JSON de dados
    const loadData = async () => {
      const result = await import("../result.json");
      setData(result.default);
    };

    // Carrega a imagem e converte para base64
    const loadImage = async () => {
      const image = await fetch("/logo.jpg");
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

  // Função para adicionar o cabeçalho
  const addHeader = (doc: jsPDF, grupo: string, dt_assembleia: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Adiciona logo
    doc.addImage(logoImage, "JPEG", 45, 15, 150, 40);
    
    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESULTADO DE ASSEMBLEIA", 410,80, {align: "center"});
    
    // Informações do usuário e data
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`USUÁRIO: FULANO`, pageWidth - 50, 25, { align: "right" });
    doc.text(`DATA: ${today.replace(/,+/g, "")}`, pageWidth - 50, 35, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`GRUPO: ${grupo}`, pageWidth - 50, 48, { align: "right",  });
    doc.text(`DATA DA ASSEMBLEIA: ${formatarDataPtBr(dt_assembleia)}`, pageWidth - 50, 58, { align: "right" });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(40, 65, pageWidth - 40, 65);
    doc.setLineWidth(0.5);
    doc.line(40, 85, pageWidth - 40, 85);
  };

  const gerarPDF = () => {
    if (!logoImage) {
      alert("A imagem não foi carregada corretamente.");
      return;
    }
  
    // Cria uma nova instância do jsPDF
    const doc = new jsPDF('l', 'pt');
    let yPosition = 90; // Posição inicial para o conteúdo
  
    // Itera sobre os dados para criar as tabelas para cada grupo
    data.forEach((assembleia, indexAssembleia) => {
      if (indexAssembleia > 0){
        doc.addPage();
        yPosition = 90;
      }
      assembleia.grupos.forEach((grupo, indexGrupo) => {
        if (indexGrupo > 0) {
          doc.addPage();
          yPosition = 90;
        }
        addHeader(doc, grupo.codigoGrupo, assembleia.dataAssembleia);
        // Cabeçalho da tabela
        const head = [
          [
            `        Tipo contemplação        `,
            "Contemplados / Suplentes",
            `Vendedor / Representante`
          ]
        ];
  
        const body: any[] = [];
  
        // Para cada tipo de lance, cria uma linha na tabela
        grupo.tiposLance.forEach((tipo) => {
          // Ordena os lances do maior para o menor percentual
          tipo.lances.sort((a, b) => b.percentualLance - a.percentualLance);
        
          const quantidade = tipo.lances.length;
          let contemplados = "";
          let vendedores = "";
        
          tipo.lances.forEach((lance, index) => {
            const num = index + 1;
            contemplados += num < 10
              ? `0${num}º - ${lance.percentualLance.toFixed(4)} %\n`
              : `${num}º - ${lance.percentualLance.toFixed(4)} %\n`;
            
            if (lance.codigoRepresentante) {
              vendedores += `Vendedor: ${lance.codigoRepresentante}\n`;
            }
          });
        
          contemplados = contemplados.trim();
          vendedores = vendedores.trim();
        
          if (tipo.tipoLance === "LANCE_OFERTADO_FIXO") {
            body.push([
              `${tipo.tipoLance.replace(/_+/g, " ")}`,
              tipo.lances[0].percentualLance.toFixed(4) + " %",
              `Total de lances ofertados: ${quantidade.toString()}`
            ]);
          } else if (tipo.tipoLance === "FIXO" || tipo.tipoLance === "SORTEIO" || tipo.tipoLance === "LIVRE") {
            if(tipo.tipoLance === "FIXO" || tipo.tipoLance === "LIVRE"){
              body.push([
                `LANCE ${tipo.tipoLance.replace(/_+/g, " ")}\n \n \n`,
                `${contemplados}\n \n \n`,
                `${vendedores}\n _____________________________ \n \nTotal de cotas contempladas: ${quantidade.toString()}`
              ]);
            } else {
              body.push([
                `${tipo.tipoLance.replace(/_+/g, " ")}\n \n \n`,
                `${contemplados}\n \n \n`,
                `${vendedores}\n _____________________________ \n \nTotal de cotas contempladas: ${quantidade.toString()}`
              ]);
            }
          } else {
            body.push([
              `${tipo.tipoLance.replace(/_+/g, " ")}\n \n \n`,
              `${contemplados}\n \n \n`,
              `${vendedores}\n _____________________________ \n \nTotal de lances ofertados: ${quantidade.toString()}`
            ]);
          }
        });
  
        // Adiciona a tabela utilizando o autotable
        const margem = 15; // Pequena margem nas laterais
  
        doc.autoTable({
          startY: yPosition,
          head: head,
          body: body,
          styles: {
            fontSize: 8,
            cellPadding: 10,
            lineWidth: 0, // Remove todas as linhas padrão
          },
          headStyles: { fillColor: "#133483", textColor: "white", halign: "center", cellPadding: 5, fontSize: 10 },
          columnStyles: {
            0: { halign: "center", valign: "middle" },
            1: { halign: "center", valign: "middle" },
            2: { halign: "center" },
            3: { halign: "center" }
          },
          theme: "grid",
          didDrawCell: (data) => {
            
            const { cell, row, column, table } = data;
            const xInicio = cell.x;
            const xFim = cell.x + cell.width;
            const yTopo = cell.y;
            const yBaixo = cell.y + cell.height;
            
            doc.setDrawColor(0); // Cor preta para as linhas
            doc.setLineWidth(0.2);
  
            // **Bordas externas completas**
            /*
            if (row.index === 0) {
              doc.line(xInicio, yTopo, xFim, yTopo); // Linha superior
            }
            if (row.index === table.body.length - 1) {
              doc.line(xInicio, yBaixo, xFim, yBaixo); // Linha inferior
            }
            if (column.index === 0) {
              doc.line(xInicio, yTopo, xInicio, yBaixo); // Borda esquerda
            }
            if (column.index === table.columns.length - 1) {
              doc.line(xFim, yTopo, xFim, yBaixo); // Borda direita
            }*/
  
            // **Linhas horizontais internas**
            if (row.index > 0) {
              // Se for a primeira ou última coluna, aplicar a margem
              if (column.index === 0) {
                doc.line(xInicio + margem, yTopo, xFim, yTopo); // Margem apenas no início
              } else if (column.index === table.columns.length - 1) {
                doc.line(xInicio, yTopo, xFim - margem, yTopo); // Margem apenas no fim
              } else {
                doc.line(xInicio, yTopo, xFim, yTopo); // Linhas internas completas
              }
            }
          }
        });
  
        yPosition = doc.lastAutoTable.finalY + 16; // Atualiza a posição para o próximo conteúdo
      });
    });
  
    // Adiciona o rodapé em todas as páginas
    const marginBottom = 20; // Distância do rodapé da parte inferior da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.internal.getNumberOfPages();

    

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      // Exibe "Página X de Y" centralizado no topo (por exemplo, na posição y = 10)
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, 10, { align: "right" });
    }
  
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
  
      // Linha do rodapé
      doc.setLineWidth(0.5);
      doc.line(40, pageHeight - 20, pageWidth - 40, pageHeight - 20);
  
      // Texto do rodapé alinhado à direita
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Groscon Administradora de Consórcios LTDA", pageWidth - 40, pageHeight - marginBottom + 10, { align: "right" });
    }
  
    // Gera e faz o download do PDF
    doc.save("relatorio_assembleia.pdf");
  };

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
      Baixar JS PDF Paisagem
    </button>
  );
}
