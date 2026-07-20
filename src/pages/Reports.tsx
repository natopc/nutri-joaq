import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FilePlus, Edit3, Trash2, List } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './Reports.css';

import MandatoryDocReportModal from './MandatoryDocReportModal';
import PendenciesReportModal from './PendenciesReportModal';

export default function Reports() {
  const { canWrite } = useAuth();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'report_templates'), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMandatoryDocModal, setShowMandatoryDocModal] = useState(false);
  const [showPendenciesModal, setShowPendenciesModal] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', desc: '' });
  const [editReport, setEditReport] = useState<any>(null);

  const handleOpenAdd = () => {
    setEditReport(null);
    setNewReport({ title: '', desc: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (report: any) => {
    setEditReport(report);
    setNewReport({ title: report.title, desc: report.desc });
    setShowAddModal(true);
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editReport) {
      await updateDoc(doc(db, 'report_templates', editReport.id), newReport);
    } else {
      await addDoc(collection(db, 'report_templates'), { ...newReport, fields: 0 });
    }
    setShowAddModal(false);
    setNewReport({ title: '', desc: '' });
    setEditReport(null);
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      await deleteDoc(doc(db, 'report_templates', id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando formulários...</div>;
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios e Formulários</h1>
          <p className="page-subtitle">Cadastre os modelos de relatórios que serão preenchidos pelas nutricionistas nas vistorias.</p>
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={handleOpenAdd}>
            <FilePlus size={20} />
            Cadastrar Novo Modelo
          </button>
        )}
      </div>

      <div className="reports-grid">
        {reports.map((report: any) => (
          <div key={report.id} className="card report-card">
            <div className="report-icon-wrapper" onClick={() => {
              if (report.title.includes("Documentação Obrigatória")) {
                setShowMandatoryDocModal(true);
              } else if (report.title.includes("Pendência") || report.title.includes("Check List Visita")) {
                setShowPendenciesModal(true);
              } else {
                alert('A visualização/preenchimento deste relatório não está configurada.');
              }
            }} title="Preencher Relatório">
              <List size={32} />
            </div>
            <div className="report-content">
              <h3>{report.title}</h3>
              <p>{report.desc}</p>
            </div>
            {canWrite && (
              <div className="report-actions">
                <button 
                  className="btn-icon text-muted hover:text-primary transition-colors" 
                  title="Editar Título e Descrição"
                  onClick={() => handleOpenEdit(report)}
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  className="btn-icon text-danger" 
                  title="Excluir"
                  onClick={() => handleDeleteReport(report.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full text-center p-8 text-muted border border-dashed rounded">
            Nenhum modelo de relatório cadastrado. Cadastre um novo modelo ou use o botão "Migrar Dados Antigos" no Dashboard.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editReport ? 'Editar Modelo de Relatório' : 'Cadastrar Modelo de Relatório'}</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddReport} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Título do Relatório</label>
                <input type="text" className="input-field" required placeholder="Ex: Controle de Pragas"
                  value={newReport.title} onChange={e => setNewReport({...newReport, title: e.target.value})} />
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Descrição Breve</label>
                <textarea className="input-field" rows={3} required placeholder="Qual o propósito deste formulário?"
                  value={newReport.desc} onChange={e => setNewReport({...newReport, desc: e.target.value})} />
              </div>
              <p className="text-muted text-sm mb-6">
                * Os campos detalhados do relatório poderão ser configurados em uma etapa posterior.
              </p>
              <div className="flex gap-4">
                <button type="button" className="btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar Modelo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMandatoryDocModal && (
        <MandatoryDocReportModal onClose={() => setShowMandatoryDocModal(false)} />
      )}

      {showPendenciesModal && (
        <PendenciesReportModal onClose={() => setShowPendenciesModal(false)} />
      )}
    </div>
  );
}
