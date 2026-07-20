import { useState, useEffect } from 'react';
import { Search, Filter, Download, FileText, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import './Inspections.css';

export default function Inspections() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unitsData: any[] = [];
    let pendsData: any = {};
    let historyData: any[] = [];

    const updateCombined = () => {
      const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      };

      // 1. Snapshot do estado atual (como era antes)
      const currentStatus = unitsData.map((u: any) => {
        const p = pendsData[u.id];
        if (p && p.checklist) {
          const simCount = p.checklist.filter((i: any) => i.status === 'SIM').length;
          const naoCount = p.checklist.filter((i: any) => i.status === 'NÃO').length;
          const total = simCount + naoCount;
          const conformity = total > 0 ? Math.round((simCount / total) * 100) : 0;
          
          return {
            id: 'curr-' + u.id,
            unit: u.name,
            week: `Semana ${getWeekNumber(new Date())} (Atual)`,
            date: p.dataReport || p.lastUpdated?.split(',')[0] || '-',
            auditor: p.respName || 'Não Informado',
            score: `${conformity}%`,
            checklist: p.checklist,
            relatorioCompleto: `Relatório atual. Total de itens avaliados: ${total}. Conformes: ${simCount}. Não conformes: ${naoCount}. Conformidade: ${conformity}%.`,
            timestamp: new Date().getTime()
          };
        } else {
          return {
            id: 'curr-' + u.id,
            unit: u.name,
            week: '-',
            date: '-',
            auditor: '-',
            score: '-',
            checklist: [],
            relatorioCompleto: 'Nenhum relatório de pendência preenchido para esta unidade ainda.',
            timestamp: 0
          };
        }
      }).filter(i => i.date !== '-');

      // 2. Histórico salvo
      const history = historyData.map(h => ({
        id: h.id,
        unit: h.unit,
        week: h.week,
        date: h.date,
        auditor: h.auditor,
        score: h.score,
        checklist: [], // history might not have full checklist saved currently
        relatorioCompleto: h.relatorioCompleto,
        timestamp: new Date(h.createdAt || 0).getTime()
      }));

      // Combina e remove duplicatas exatas se houver
      const all = [...currentStatus, ...history];
      setInspections(all.sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    };

    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      unitsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombined();
    });
    
    const unsubPends = onSnapshot(collection(db, 'reports_pendencies'), (snapshot) => {
      snapshot.docs.forEach(d => { pendsData[d.id] = d.data(); });
      updateCombined();
    });

    const unsubHistory = onSnapshot(collection(db, 'reports_inspections'), (snapshot) => {
      historyData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombined();
    });

    return () => {
      unsubUnits();
      unsubPends();
      unsubHistory();
    };
  }, []);

  const [showReadModal, setShowReadModal] = useState<any>(null);

  const handleDelete = async (inspection: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este relatório? Essa ação não pode ser desfeita.')) return;
    
    try {
      if (String(inspection.id).startsWith('curr-')) {
        const actualId = String(inspection.id).replace('curr-', '');
        await deleteDoc(doc(db, 'reports_pendencies', actualId));
      } else {
        await deleteDoc(doc(db, 'reports_inspections', String(inspection.id)));
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir o relatório.');
    }
  };

  const downloadReportPDF = async (inspection: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    
    let checklistHTML = '';
    if (inspection.checklist && inspection.checklist.length > 0) {
      const grouped: any = {};
      inspection.checklist.forEach((item: any) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });

      const categoryTitles: Record<number, string> = {
        1: "1. Documentação, Água e Estrutura Geral",
        2: "2. Sanitários, Vestiários e DML",
        3: "3. Equipamentos de Refrigeração e Climatização",
        4: "4. Manipulação de Alimentos, Processos e Controle de Pragas",
        5: "5. Equipamentos, Utensílios e Áreas de Apoio"
      };

      for (const category in grouped) {
        const catTitle = categoryTitles[Number(category)] || `Categoria ${category}`;
        checklistHTML += `<h4 style="margin-top: 20px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${catTitle}</h4>`;
        checklistHTML += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
                <tr style="background: #f9f9f9;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 45%;">Item</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 10%;">Status</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 30%;">Observação</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 15%;">Foto</th>
                </tr>
            </thead>
            <tbody>`;
        
        grouped[category].forEach((item: any) => {
          const statusColor = item.status === 'SIM' ? '#16a34a' : item.status === 'NÃO' ? '#dc2626' : '#6b7280';
          const bg = item.status === 'NÃO' ? '#fef2f2' : 'transparent';
          checklistHTML += `
              <tr style="background-color: ${bg};">
                  <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${item.text}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">${item.obs || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; font-size: 13px; text-align: center;">
                      ${item.photo ? `<img src="${item.photo}" style="max-width: 60px; max-height: 60px; border-radius: 4px;" />` : '-'}
                  </td>
              </tr>
          `;
        });
        
        checklistHTML += `</tbody></table>`;
      }
    } else {
      checklistHTML = '<p>Nenhum checklist detalhado salvo neste histórico.</p>';
    }

    const div = document.createElement('div');
    div.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; background: white; color: black; width: 1000px;">
        <h1 style="color: #A65233; border-bottom: 2px solid #F09A37; padding-bottom: 10px;">Relatório Semanal de Vistoria - Nutri Joaq</h1>
        <h2>Unidade: ${inspection.unit}</h2>
        <div style="display: flex; gap: 40px; margin-bottom: 20px;">
          <p><strong>Semana de Referência:</strong> ${inspection.week || inspection.type}</p>
          <p><strong>Data de Fechamento:</strong> ${inspection.date}</p>
          <p><strong>Auditor:</strong> ${inspection.auditor}</p>
          <p><strong>Conformidade:</strong> ${inspection.score}</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <strong>Resumo:</strong> ${inspection.relatorioCompleto}
        </div>
        
        <h3>Checklist Completo</h3>
        ${checklistHTML}
      </div>
    `;
    div.style.position = 'absolute';
    div.style.top = '-9999px';
    document.body.appendChild(div);

    await new Promise(r => setTimeout(r, 300));

    try {
      const canvas = await html2canvas(div, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', [pdfWidth, Math.max(297, pdfHeight)]);
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_${inspection.unit.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
    } finally {
      document.body.removeChild(div);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando histórico...</div>;
  }

  return (
    <div className="inspections-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Vistorias</h1>
          <p className="page-subtitle">Acompanhe o histórico de avaliações e relatórios das UANs.</p>
        </div>
      </div>

      <div className="card list-card">
        <div className="list-header">
          <h3>Lista de Auditorias</h3>
          <div className="list-filters">
            <div className="search-box">
              <Search size={16} className="text-muted" />
              <input type="text" placeholder="Buscar relatório..." />
            </div>
            <button className="btn-secondary"><Filter size={16} /> Filtros</button>
          </div>
        </div>

        <table className="inspections-table">
          <thead>
            <tr>
              <th>Unidade / Local</th>
              <th>Semana Referência</th>
              <th>Data Fechamento</th>
              <th>Responsável</th>
              <th>Conformidade</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((ins, idx) => (
              <tr key={idx} onClick={() => setShowReadModal(ins)} className="clickable-row">
                <td className="font-semibold">{ins.unit}</td>
                <td>{ins.week || ins.type}</td>
                <td>{ins.date}</td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar-tiny">{ins.auditor.charAt(0)}</div>
                    {ins.auditor}
                  </div>
                </td>
                <td className="font-medium">{ins.score || 'N/A'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button className="btn-icon" onClick={(e) => downloadReportPDF(ins, e)} title="Exportar PDF">
                      <Download size={18} />
                    </button>
                    <button className="btn-icon" style={{color: '#dc2626'}} onClick={(e) => handleDelete(ins, e)} title="Excluir">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {inspections.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-8 text-muted">Nenhuma vistoria encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showReadModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" />
                <h2>Leitura de Relatório</h2>
              </div>
              <button onClick={() => setShowReadModal(null)} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h3 className="font-serif text-xl mb-1">{showReadModal.week || showReadModal.type}</h3>
                  <div className="text-muted text-sm">{showReadModal.unit} • Fechamento: {showReadModal.date}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {showReadModal.score && <span className="text-sm font-semibold text-gray-700">Score: {showReadModal.score}</span>}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm text-muted uppercase tracking-wider mb-2 font-semibold">Laudo Completo</h4>
                <div className="p-4 bg-gray-50 rounded border text-gray-800 leading-relaxed">
                  {showReadModal.relatorioCompleto}
                </div>
              </div>

              <div className="flex gap-4">
                <button className="btn-secondary w-full" onClick={() => setShowReadModal(null)}>Fechar</button>
                <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => downloadReportPDF(showReadModal)}>
                  <Download size={18} /> Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
