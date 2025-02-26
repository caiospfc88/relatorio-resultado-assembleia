"use client"
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function formatarDataPtBr(data: string) {
    const ano = data.substring(0, 4);
    const mes = data.substring(5, 7);
    const dia = data.substring(8, 10);
    return `${dia}/${mes}/${ano}`;
}

const BotaoNovo = () => {

    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);

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

  const generatePDF = () => {
    if (!logoImage) {
        alert("A imagem não foi carregada corretamente.");
        return;
    }

    // Cria um novo documento PDF (formato retrato, em pontos)
    const doc = new jsPDF('p', 'pt');

    // Cabeçalho do relatório
    doc.addImage(logoImage, "JPEG", 400, 22, 155, 42);
    doc.setFontSize(18);
    doc.text('Relatório de Assembleias', 40, 40);
    doc.setFontSize(12);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 40, 60);
    doc.setLineWidth(1);
    doc.line(40, 70, doc.internal.pageSize.getWidth() - 40, 70);

    // Variável que controla a posição vertical
    let y = 90;

    // Percorre cada assembleia
    data.forEach((assembleia, idxAssembleia) => {
        
      doc.setFontSize(14);
      doc.text(`Assembleia: ${formatarDataPtBr(assembleia.dataAssembleia)}`, 40, y);
      y += 20;

      // Percorre os grupos
      assembleia.grupos.forEach((grupo, indexGrupo) => {

        if (indexGrupo > 0) {
            doc.addPage();
            y = 40; // Reinicia a posição vertical no topo da nova página
        }

        doc.setFontSize(12);
        doc.text(`Grupo: ${grupo.codigoGrupo}`, 60, y);
        y += 20;

        // Percorre os tipos de lance
        grupo.tiposLance.forEach((tipo) => {
            const quantidade = tipo.lances.length;
          doc.setFontSize(12);
          doc.text(`Tipo de Lance: ${tipo.tipoLance.replace(/_+/g, " ")} - ${quantidade} lance(s) ofertado(s)`, 80, y);
          y += 20;

          // Define as colunas da tabela
          const columns = [
            { header: 'Percentual', dataKey: 'percentualLance' },
            { header: 'Vendedor', dataKey: 'codigoRepresentante' }
          ];

          // Mapeia os dados dos lances
          console.log('tipo',tipo)
          // Ordena os lances do maior para o menor percentual antes de gerar a tabela
          const sortedLances = [...tipo.lances].sort((a, b) => b.percentualLance - a.percentualLance);
          var rows = []
            if (tipo.tipoLance === "LANCE_OFERTADO_FIXO") {
                rows = [{
                    percentualLance: sortedLances[0].percentualLance.toFixed(4) + ' %',
                    codigoRepresentante: sortedLances[0].codigoRepresentante || 'N/A'
                }];
            } else {
               rows = sortedLances.map((lance, index) => ({
                
                    percentualLance: `${index+1}º - ` + lance.percentualLance.toFixed(4) + ' %',
                    codigoRepresentante: lance.codigoRepresentante || 'N/A'
                }));
            }
            

          // Gera a tabela com estilo profissional
          doc.autoTable({
            startY: y,
            head: [columns.map(col => col.header)],
            body: rows.map(row => columns.map(col => row[col.dataKey])),
            theme: 'striped',
            styles: {
              fontSize: 9,
              cellPadding: 4,
              halign: "center",
            },
            headStyles: {
              fillColor: "#133483", textColor: "white", halign: "center", fontSize: 10,
              fontStyle: 'bold'
            },
            margin: { left: 80, right: 40 },
            tableWidth: 'auto'
          });

          // Atualiza a posição vertical para a próxima tabela
          y = doc.lastAutoTable.finalY + 20;

          // Se a posição ultrapassar o final da página, cria nova página
          if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 40;
          }
        });
      });

      // Se houver mais de uma assembleia, adiciona nova página
      if (idxAssembleia < data.length - 1) {
        doc.addPage();
        y = 40;
      }
    });

    const marginBottom = 16; // Distância do rodapé da parte inferior da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.internal.getNumberOfPages();
  
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
  
      // Linha do rodapé
      doc.setLineWidth(0.5);
      doc.line(40, pageHeight -30, doc.internal.pageSize.getWidth() - 40, pageHeight -30);
  
      // Texto do rodapé alinhado à direita
      doc.setFontSize(8);
      doc.text("Groscon Administradora de Consórcios LTDA", pageWidth - 45, pageHeight - marginBottom, { align: "right" });
    }

    // Salva o PDF
    doc.save('relatorio.pdf');
  };

  return (
    <div style={{ margin: '20px' }}>
      <button
        onClick={generatePDF}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Gerar PDF Novo
      </button>
    </div>
  );
};

export default BotaoNovo;
