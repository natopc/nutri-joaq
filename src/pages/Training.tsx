import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlayCircle, Search, Plus, ExternalLink, Calendar, MapPin, Clock, Trash2, CalendarDays, Edit2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './Training.css';

export default function Training() {
  const { canWrite } = useAuth();
  
  const [trainings, setTrainings] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubVideos = onSnapshot(collection(db, 'training_videos'), (snapshot) => {
      setTrainings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubAgenda = onSnapshot(collection(db, 'trainings'), (snapshot) => {
      const loadedAgenda = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedAgenda = loadedAgenda.sort((a: any, b: any) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      setAgenda(sortedAgenda);
    });
    
    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      setUnitsData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    
    return () => {
      unsubVideos();
      unsubAgenda();
      unsubUnits();
    };
  }, []);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [newTraining, setNewTraining] = useState({ title: '', desc: '', videoUrl: '' });
  const [newAgenda, setNewAgenda] = useState({ unit: '', theme: '', date: '', time: '', observations: '' });
  const [editTraining, setEditTraining] = useState<any>(null);
  const [editAgendaItem, setEditAgendaItem] = useState<any>(null);

  const handleOpenAdd = () => {
    setEditTraining(null);
    setNewTraining({ title: '', desc: '', videoUrl: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (training: any) => {
    setEditTraining(training);
    setNewTraining({ title: training.title, desc: training.desc, videoUrl: training.videoUrl });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!editTraining) return;
    if (window.confirm('Tem certeza que deseja excluir este vídeo?')) {
      await deleteDoc(doc(db, 'training_videos', String(editTraining.id)));
      setShowAddModal(false);
      setEditTraining(null);
    }
  };

  const filteredTrainings = trainings.filter((t: any) => 
    (t.title && t.title.toLowerCase().includes(search.toLowerCase())) || 
    (t.desc && t.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    let embedUrl = newTraining.videoUrl;
    
    if (embedUrl.includes('watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    }

    const dataToSave = { ...newTraining, videoUrl: embedUrl };

    if (editTraining) {
      await updateDoc(doc(db, 'training_videos', String(editTraining.id)), dataToSave);
    } else {
      await addDoc(collection(db, 'training_videos'), dataToSave);
    }
    
    setShowAddModal(false);
    setEditTraining(null);
    setNewTraining({ title: '', desc: '', videoUrl: '' });
  };

  const handleOpenAgenda = () => {
    setEditAgendaItem(null);
    setNewAgenda({ unit: unitsData[0]?.name || '', theme: '', date: '', time: '', observations: '' });
    setShowAgendaModal(true);
  };

  const handleOpenEditAgenda = (item: any) => {
    setEditAgendaItem(item);
    setNewAgenda({ unit: item.unit, theme: item.theme, date: item.date, time: item.time, observations: item.observations || '' });
    setShowAgendaModal(true);
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editAgendaItem) {
      await updateDoc(doc(db, 'trainings', String(editAgendaItem.id)), newAgenda);
    } else {
      await addDoc(collection(db, 'trainings'), newAgenda);
    }
    
    setShowAgendaModal(false);
    setEditAgendaItem(null);
  };

  const handleDeleteAgenda = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este treinamento?')) {
      await deleteDoc(doc(db, 'trainings', id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando treinamentos...</div>;
  }

  return (
    <div className="training-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Treinamentos</h1>
          <p className="page-subtitle">Capacitação contínua para a equipe das UANs.</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={handleOpenAgenda}>
              <CalendarDays size={20} />
              Agendar Presencial
            </button>
            <button className="btn-primary" onClick={handleOpenAdd}>
              <Plus size={20} />
              Novo Vídeo
            </button>
          </div>
        )}
      </div>

      <div className="search-bar-container">
        <div className="search-box">
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou descrição..." 
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-serif text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
          <CalendarDays size={24} className="text-primary" />
          Agenda de Treinamentos Presenciais
        </h2>
        
        {agenda.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agenda.map((item: any) => (
              <div key={item.id} className="card p-5 border-l-4 border-l-primary bg-orange-50/30">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">{item.theme}</h3>
                  {canWrite && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditAgenda(item)} className="text-gray-400 hover:text-primary transition-colors" title="Editar Treinamento">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteAgenda(item.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Cancelar Treinamento">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary opacity-70" />
                    <span className="truncate" title={item.unit}>{item.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary opacity-70" />
                    <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary opacity-70" />
                    <span>{item.time}</span>
                  </div>
                  {item.observations && (
                    <div className="mt-2 pt-2 border-t border-orange-100 italic text-xs">
                      Obs: {item.observations}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-muted border border-dashed rounded bg-gray-50">
            Nenhum treinamento presencial agendado.
          </div>
        )}
      </div>

      <h2 className="text-xl font-serif text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
        <PlayCircle size={24} className="text-primary" />
        Biblioteca de Vídeos (Online)
      </h2>

      <div className="training-grid">
        {filteredTrainings.map((training: any) => (
          <div key={training.id} className="card training-card">
            <div className="video-container">
              <iframe 
                width="100%" 
                height="200" 
                src={training.videoUrl} 
                title={training.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="training-content relative">
              <h3 className="training-title pr-8">{training.title}</h3>
              <p className="training-desc">{training.desc}</p>
              {canWrite && (
                <button 
                  className="absolute top-4 right-4 p-2 text-muted hover:text-primary transition-colors bg-white rounded-full shadow-sm"
                  onClick={() => handleOpenEdit(training)}
                  title="Editar Treinamento"
                >
                  <ExternalLink size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTrainings.length === 0 && (
          <div className="col-span-full text-center p-8 text-muted border border-dashed rounded bg-gray-50">
            Nenhum treinamento em vídeo cadastrado.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editTraining ? 'Editar Treinamento' : 'Cadastrar Treinamento'}</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddTraining} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Título do Treinamento</label>
                <input type="text" className="input-field" required 
                  value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Descrição Breve</label>
                <textarea className="input-field" rows={3} required
                  value={newTraining.desc} onChange={e => setNewTraining({...newTraining, desc: e.target.value})} />
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Link do YouTube</label>
                <input type="url" className="input-field" placeholder="Ex: https://youtube.com/watch?v=..." required 
                  value={newTraining.videoUrl} onChange={e => setNewTraining({...newTraining, videoUrl: e.target.value})} />
              </div>
              <div className="flex gap-4">
                {editTraining && (
                  <button type="button" className="btn-secondary text-danger border-red-200 hover:bg-red-50 hover:border-red-300" onClick={handleDelete}>
                    Excluir
                  </button>
                )}
                <button type="button" className="btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAgendaModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editAgendaItem ? 'Editar Agendamento' : 'Agendar Treinamento Presencial'}</h2>
              <button onClick={() => setShowAgendaModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddAgenda} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Unidade</label>
                <select className="input-field" required value={newAgenda.unit} onChange={e => setNewAgenda({...newAgenda, unit: e.target.value})}>
                  {unitsData.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                  {unitsData.length === 0 && <option value="Unidade Padrão">Unidade Padrão</option>}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Tema do Treinamento</label>
                <input type="text" className="input-field" placeholder="Ex: Higiene Pessoal" required 
                  value={newAgenda.theme} onChange={e => setNewAgenda({...newAgenda, theme: e.target.value})} />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="input-label">Data</label>
                  <input type="date" className="input-field" required 
                    value={newAgenda.date} onChange={e => setNewAgenda({...newAgenda, date: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="input-label">Hora</label>
                  <input type="time" className="input-field" required 
                    value={newAgenda.time} onChange={e => setNewAgenda({...newAgenda, time: e.target.value})} />
                </div>
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Observações</label>
                <textarea className="input-field" rows={2} placeholder="Ex: Público alvo, material necessário..." 
                  value={newAgenda.observations} onChange={e => setNewAgenda({...newAgenda, observations: e.target.value})} />
              </div>
              
              <div className="flex gap-4">
                <button type="button" className="btn-secondary w-full" onClick={() => setShowAgendaModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
