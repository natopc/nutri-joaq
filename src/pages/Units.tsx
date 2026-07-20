import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Plus, MapPin, ChefHat, Calendar, Info, AlertTriangle, FileText, List } from 'lucide-react';
import './Units.css';
import MandatoryDocReportModal from './MandatoryDocReportModal';
import PendenciesReportModal from './PendenciesReportModal';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';

export default function Units() {
  const { canWrite } = useAuth();
  
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'units'), (snapshot) => {
      const unitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      unitsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setUnits(unitsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editUnit, setEditUnit] = useState<any>(null);
  
  const [showDocReportForUnit, setShowDocReportForUnit] = useState<any>(null);
  const [showPendenciesModal, setShowPendenciesModal] = useState<any>(null);

  const [docsData, setDocsData] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reports_docs'), (snapshot) => {
      const docs: any = {};
      snapshot.docs.forEach(docSnapshot => {
        docs[docSnapshot.id] = docSnapshot.data();
      });
      setDocsData(docs);
    });
    return () => unsubscribe();
  }, []);

  const hasExpiredDocs = (unitId: string) => {
    const unitDocs = docsData[unitId];
    if (!unitDocs) return false;
    
    // Verifica marcação manual de vencido na tabela 1
    const hasManualAlert = unitDocs.docs && unitDocs.docs.some((d: any) => d.status === 'alert');
    
    // Verifica automaticamente as datas de validade (formato YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    const docsExpired = unitDocs.docs && unitDocs.docs.some((d: any) => d.validade && d.validade < today);
    const mainExpired = unitDocs.maintenance && unitDocs.maintenance.some((d: any) => d.proxExec && d.proxExec < today);
    const waterExpired = unitDocs.water && unitDocs.water.some((d: any) => d.validade && d.validade < today);
    const empExpired = unitDocs.employee && unitDocs.employee.some((d: any) => d.validade && d.validade < today);
    const secExpired = unitDocs.security && unitDocs.security.some((d: any) => (d.validade1 && d.validade1 < today) || (d.validade2 && d.validade2 < today));
    
    return hasManualAlert || docsExpired || mainExpired || waterExpired || empExpired || secExpired;
  };

  const [newUnit, setNewUnit] = useState({ name: '', location: '', lastInspection: '', desc: '' });

  const handleOpenAdd = () => {
    setEditUnit(null);
    setNewUnit({ name: '', location: '', lastInspection: '', desc: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedUnit) return;
    setEditUnit(selectedUnit);
    setNewUnit({ 
      name: selectedUnit.name, 
      location: selectedUnit.location, 
      lastInspection: selectedUnit.lastInspection || '',
      desc: selectedUnit.desc || '' 
    });
    setSelectedUnit(null);
    setShowAddModal(true);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUnit) {
        await updateDoc(doc(db, 'units', String(editUnit.id)), newUnit);
      } else {
        const unit = {
          name: newUnit.name,
          location: newUnit.location,
          lastInspection: newUnit.lastInspection || 'Sem vistoria',
          status: 'Pendente',
          icon: 'store',
          desc: newUnit.desc
        };
        await addDoc(collection(db, 'units'), unit);
      }
      setShowAddModal(false);
      setEditUnit(null);
      setNewUnit({ name: '', location: '', lastInspection: '', desc: '' });
    } catch (err) {
      console.error('Erro ao salvar unidade:', err);
      alert('Ocorreu um erro ao salvar a unidade.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando unidades...</div>;
  }

  return (
    <div className="units-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Unidades</h1>
          <p className="page-subtitle">Gestão e acompanhamento das Unidades de Alimentação e Nutrição.</p>
        </div>
        <div className="header-actions">
          {canWrite && (
            <button className="btn-primary" onClick={handleOpenAdd}>
              <Plus size={20} />
              Nova Unidade
            </button>
          )}
        </div>
      </div>

      {units.length === 0 ? (
        <div className="p-8 text-center text-muted bg-white rounded-lg border border-gray-200 mt-6">
          Nenhuma unidade cadastrada. Clique em "Nova Unidade" para começar.
        </div>
      ) : (
        <div className="units-grid">
          {units.map(unit => (
            <div key={unit.id} className="card unit-card">
              <div className="unit-card-header" style={{ justifyContent: 'flex-end' }}>
                <div className="unit-icon-wrapper">
                  {unit.icon === 'store' && <Store size={24} />}
                  {unit.icon === 'chefhat' && <ChefHat size={24} />}
                  {unit.icon === 'calendar' && <Calendar size={24} />}
                </div>
              </div>
              <h3 className="unit-name">{unit.name}</h3>
              
              <div className="unit-details">
                <div className="detail-item">
                  <MapPin size={16} className="text-muted" />
                  <span><span className="text-muted text-sm mr-1">Endereço:</span>{unit.location}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} className="text-muted" />
                  <div>
                    <div className="text-sm text-muted">Última Visita</div>
                    <div className="font-semibold">{unit.lastInspection}</div>
                  </div>
                </div>
              </div>
              
              {hasExpiredDocs(unit.id) && (
                <div className="mt-4 p-2 border border-red-200 rounded-md flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: '#FEF2F2' }}>
                  <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
                  <span style={{ color: '#EF4444' }}>Você tem documento vencido, atualize</span>
                </div>
              )}

              <div className="unit-card-footer mt-4">
                <button className="btn-secondary w-full" onClick={() => setSelectedUnit(unit)}>
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Unidade */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editUnit ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddUnit} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Nome da Unidade</label>
                <input type="text" className="input-field" required 
                  value={newUnit.name} onChange={e => setNewUnit({...newUnit, name: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Data da Última Visita</label>
                <input type="text" className="input-field" placeholder="Ex: 12 Out 2023"
                  value={newUnit.lastInspection} onChange={e => setNewUnit({...newUnit, lastInspection: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Endereço</label>
                <input type="text" className="input-field" required 
                  value={newUnit.location} onChange={e => setNewUnit({...newUnit, location: e.target.value})} />
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Descrição Breve</label>
                <textarea className="input-field" rows={3}
                  value={newUnit.desc} onChange={e => setNewUnit({...newUnit, desc: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalhes */}
      {selectedUnit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Info className="text-primary" />
                <h2>Detalhes da Unidade</h2>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <h3 className="font-serif text-lg mb-2">{selectedUnit.name}</h3>
              <p className="text-muted mb-6">{selectedUnit.desc}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded col-span-2">
                  <div className="text-sm text-muted">Endereço</div>
                  <div className="font-semibold">{selectedUnit.location}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded col-span-2">
                  <div className="text-sm text-muted">Última Visita</div>
                  <div className="font-semibold">{selectedUnit.lastInspection}</div>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <button className="btn-secondary w-full" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}} onClick={() => setShowDocReportForUnit(selectedUnit)}>
                  <FileText size={18} /> Documentação Obrigatória
                </button>
                <button className="btn-secondary w-full" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}} onClick={() => setShowPendenciesModal(selectedUnit)}>
                  <List size={18} /> Relatório de Pendências
                </button>
              </div>

              <div className="flex gap-4">
                <button className="btn-secondary w-full" onClick={() => setSelectedUnit(null)}>Fechar</button>
                {canWrite && <button className="btn-primary w-full" onClick={handleOpenEdit}>Editar Unidade</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Documentação Obrigatória */}
      {showDocReportForUnit && (
        <MandatoryDocReportModal 
          unitId={showDocReportForUnit.id} 
          unitName={showDocReportForUnit.name}
          onClose={() => setShowDocReportForUnit(null)} 
        />
      )}

      {/* Modal Relatório de Pendências */}
      {showPendenciesModal && (
        <PendenciesReportModal 
          unitId={showPendenciesModal.id} 
          unitName={showPendenciesModal.name}
          onClose={() => setShowPendenciesModal(null)} 
        />
      )}

    </div>
  );
}
