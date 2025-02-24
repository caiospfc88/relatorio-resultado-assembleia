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

export default function BotaoPDFJspdf() {
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

  const gerarPDF = () => {
    if (!logoImage) {
      alert("A imagem não foi carregada corretamente.");
      return;
    }
  
    // Cria uma nova instância do jsPDF
    const doc = new jsPDF();
    let yPosition = 15; // Posição inicial para o conteúdo
  
    // Cabeçalho
    doc.addImage(logoImage, "JPEG", 15, yPosition, 45, 12);
    doc.setFontSize(15);
    doc.text("RESULTADO DE ASSEMBLEIA", 70, yPosition + 10);
    doc.setFontSize(8);
    doc.text(`DATA: ${today}`, 190, yPosition + 6, {align: "right"});
    doc.text(`USUÁRIO: FULANO`, 190, yPosition + 10,  {align: "right"});
    yPosition += 20;
  
    // Itera sobre os dados para criar as tabelas para cada grupo
    data.forEach((assembleia) => {
      assembleia.grupos.forEach((grupo, indexGrupo) => {
        if (indexGrupo > 0) {
          doc.addPage();
          yPosition = 15;
        }
        // Cabeçalho da tabela
        const head = [
          [
            `Grupo ${grupo.codigoGrupo}`,
            "Quantidade",
            "Contemplados",
            `Assembleia ${formatarDataPtBr(assembleia.dataAssembleia)}`
          ]
        ];
  
        const body: any[] = [];
  
        // Para cada tipo de lance, cria uma linha na tabela
        grupo.tiposLance.forEach((tipo: any) => {
          const quantidade = tipo.lances.length;
          let contemplados = "";
          let vendedores = "";
  
          tipo.lances.forEach((lance: any, index: number) => {
            if (tipo.tipoLance == "LANCE_OFERTADO_LIVRE" && index < tipo.lances.length - 1){
              const num = index + 1;
            // Adiciona a linha de contemplados (com espaçamento especial se o número for menor que 10)
            contemplados += num < 10
              ? `0${num}º - ${lance.percentualLance.toFixed(4)} %\n`
              : `${num}º - ${lance.percentualLance.toFixed(4)} %\n`;
            if (lance.codigoRepresentante) {
              vendedores += `Vendedor: ${lance.codigoRepresentante}\n`;
            }
            } else {
              const num = index + 1;
            // Adiciona a linha de contemplados (com espaçamento especial se o número for menor que 10)
            contemplados += num < 10
              ? `0${num}º - ${lance.percentualLance.toFixed(4)} %\n`
              : `${num}º - ${lance.percentualLance.toFixed(4)} %\n`;
            if (lance.codigoRepresentante) {
              vendedores += `Vendedor: ${lance.codigoRepresentante}\n`;
            }
            }
            
          });
  
          // Remove quebras de linha extras
          contemplados = contemplados.trim();
          vendedores = vendedores.trim();
          if (tipo.tipoLance == "LANCE_OFERTADO_FIXO") {
            console.log('temp',tipo)
            body.push([tipo.tipoLance.replace(/_+/g, " "), quantidade.toString(), tipo.lances[0].percentualLance.toFixed(4) + " %"]);
          } else {
            body.push([tipo.tipoLance.replace(/_+/g, " "), quantidade.toString(), contemplados, vendedores]);
          }
          
        });
  
        // Adiciona a tabela utilizando o autotable
        const margem = 5; // Pequena margem nas laterais
  
        doc.autoTable({
          startY: yPosition,
          head: head,
          body: body,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineWidth: 0, // Remove todas as linhas padrão
          },
          headStyles: { fillColor: "#133483", textColor: "white", halign: "center", cellPadding: 2, },
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
            if (data.row.raw[0] === "LANCE OFERTADO LIVRE") {
              data.cell.styles.fillColor = "#D3D3D3"
            }
            doc.setDrawColor(0); // Cor preta para as linhas
            doc.setLineWidth(0.2);
  
            // **Bordas externas completas**
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
            }
  
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
    const marginBottom = 16; // Distância do rodapé da parte inferior da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.internal.getNumberOfPages();
  
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
  
      // Linha do rodapé
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
  
      // Texto do rodapé alinhado à direita
      doc.setFontSize(7);
      doc.text("Groscon Administradora de Consórcios LTDA", pageWidth - 15, pageHeight - marginBottom + 10, { align: "right" });
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
      Baixar JS PDF
    </button>
  );
}
