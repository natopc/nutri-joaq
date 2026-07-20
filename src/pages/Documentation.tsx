import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Folder, FileText, UploadCloud, Search, MoreVertical, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './Documentation.css';

export default function Documentation() {
  const { canWrite } = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'doc_categories'), (snapshot) => {
      const catsData = snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      catsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCategories(catsData);
    });
    const unsubFiles = onSnapshot(collection(db, 'doc_files'), (snapshot) => {
      const files = snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      // Ordenar do mais recente para o mais antigo (simulado)
      setRecentFiles(files.reverse());
      setLoadingData(false);
    });
    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      const unitsData = snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      unitsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setAvailableUnits(unitsData);
    });

    return () => {
      unsubCat();
      unsubFiles();
      unsubUnits();
    };
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', category: 'Sem Categoria', desc: '', unit: 'Geral', url: '' });
  const [uploading, setUploading] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleEditFileClick = (file: any) => {
    setNewFile({ 
      ...file, 
      category: file.cat,
      desc: file.desc || '',
      url: file.url || ''
    });
    setShowAddModal(true);
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const finalName = newFile.name || "Arquivo Sem Nome";
      const fileUrl = newFile.url || '';
      const fileSize = "Link Externo"; // Indica que não está hospedado no Storage

      const fileData = {
        name: finalName,
        cat: newFile.category,
        unit: newFile.unit,
        desc: newFile.desc,
        date: new Date().toLocaleDateString('pt-BR'),
        size: fileSize,
        url: fileUrl
      };

      if ((newFile as any).id) {
        await updateDoc(doc(db, 'doc_files', String((newFile as any).id)), fileData);
      } else {
        await addDoc(collection(db, 'doc_files'), fileData);
      }

      setShowAddModal(false);
      setNewFile({ name: '', category: 'Sem Categoria', desc: '', unit: 'Geral', url: '' });
    } catch (error) {
      console.error("Erro ao salvar: ", error);
      alert("Erro ao salvar os dados do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategory) {
      await updateDoc(doc(db, 'doc_categories', String(editCategory.id)), { name: newCategoryName });
    } else {
      await addDoc(collection(db, 'doc_categories'), { name: newCategoryName, count: 0 });
    }
    setShowCatModal(false);
    setEditCategory(null);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async () => {
    if (!editCategory) return;
    if (window.confirm('Tem certeza que deseja excluir esta pasta?')) {
      await deleteDoc(doc(db, 'doc_categories', String(editCategory.id)));
      setShowCatModal(false);
      setEditCategory(null);
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      try {
        await deleteDoc(doc(db, 'doc_files', String(file.id)));
      } catch(e) {
        console.error(e);
        alert("Erro ao excluir o arquivo.");
      }
    }
  };

  const handleDownload = (file: any) => {
    if (file.url) {
      // Abre o link do Google Drive/OneDrive em nova aba
      window.open(file.url, '_blank');
    } else {
      alert("Este arquivo não possui um link de download válido.");
    }
  };

  const displayedFiles = recentFiles.filter((f: any) => {
    const matchCat = selectedCategory ? f.cat === selectedCategory : true;
    const matchUnit = selectedUnit ? (f.unit || 'Geral') === selectedUnit : true;
    return matchCat && matchUnit;
  });

  return (
    <div className="docs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentação</h1>
          <p className="page-subtitle">Central de links e arquivos importantes das unidades.</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => {
              setEditCategory(null);
              setNewCategoryName('');
              setShowCatModal(true);
            }}>
              <Plus size={20} />
              Nova Pasta
            </button>
            <button className="btn-primary" onClick={() => {
              setEditCategory(null);
              setNewFile({ name: '', category: categories.length > 0 ? categories[0].name : 'Sem Categoria', desc: '', unit: 'Geral', url: '' });
              setShowAddModal(true);
            }}>
              <UploadCloud size={20} />
              Novo Link
            </button>
          </div>
        )}
      </div>

      <div className="folders-grid">
        {categories.length === 0 && !loadingData && (
          <div className="text-muted p-4 border border-dashed rounded text-center w-full col-span-full">
            Nenhuma pasta criada ainda. Clique em "Nova Pasta" para começar.
          </div>
        )}
        {categories.map(cat => {
          const realCount = recentFiles.filter(f => f.cat === cat.name).length;
          return (
          <div 
            key={cat.id} 
            className={`folder-card ${selectedCategory === cat.name ? 'active-folder' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            style={selectedCategory === cat.name ? { borderColor: 'var(--color-primary)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } : {}}
          >
            <div className="folder-icon-wrapper relative">
              <div className="folder-icon">
                <Folder size={24} />
              </div>
              <div className="flex items-center gap-2">
                <span className="folder-count">{realCount} {realCount === 1 ? 'arquivo' : 'arquivos'}</span>
                {canWrite && (
                  <button 
                    className="p-1 text-muted hover:text-primary transition-colors bg-white rounded-full shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCategory(cat);
                      setNewCategoryName(cat.name);
                      setShowCatModal(true);
                    }}
                    title="Editar Pasta"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="folder-name">{cat.name}</div>
          </div>
        )})}
      </div>

      <div className="files-section-header">
        <h2>
          {selectedCategory ? `Arquivos em "${selectedCategory}"` : 'Links Recentes'}
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="ml-4 text-sm text-primary hover:underline font-normal"
            >
              Limpar filtro
            </button>
          )}
        </h2>
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input type="text" placeholder="Buscar arquivo..." className="input-field" style={{ border: 'none', outline: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', overflowX: 'auto', borderBottom: '1px solid #eee', marginBottom: '16px' }}>
        <button 
          onClick={() => setSelectedUnit(null)}
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', background: selectedUnit === null ? 'var(--color-primary)' : '#fff', color: selectedUnit === null ? '#fff' : '#555', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
        >
          Todos
        </button>
        <button 
          onClick={() => setSelectedUnit('Geral')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', background: selectedUnit === 'Geral' ? 'var(--color-primary)' : '#fff', color: selectedUnit === 'Geral' ? '#fff' : '#555', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: '500', transition: 'all 0.2s' }}
        >
          Geral (Rede)
        </button>
        {availableUnits.map(u => (
          <button 
            key={u.id}
            onClick={() => setSelectedUnit(u.name)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', background: selectedUnit === u.name ? 'var(--color-primary)' : '#fff', color: selectedUnit === u.name ? '#fff' : '#555', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: '500', transition: 'all 0.2s' }}
          >
            {u.name}
          </button>
        ))}
      </div>

      <div className="files-table-container">
        {loadingData ? (
          <div className="docs-empty-state">Carregando arquivos...</div>
        ) : displayedFiles.length > 0 ? (
          <table className="files-table">
            <thead>
              <tr>
                <th>Nome do Arquivo</th>
                <th>Unidade</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Tamanho</th>
                <th style={{ textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {displayedFiles.map(file => (
                <tr key={file.id}>
                  <td>
                    <div className="file-name-cell">
                      <FileText size={18} className="file-icon" />
                      {file.name}
                    </div>
                  </td>
                  <td>{file.unit || 'Geral'}</td>
                  <td>{file.cat}</td>
                  <td>{file.date}</td>
                  <td>{file.size}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex justify-center items-center gap-2">
                      <button className="btn-icon text-muted" title="Abrir Link" onClick={() => handleDownload(file)}>
                        <ExternalLink size={18} />
                      </button>
                      {canWrite && (
                        <>
                          <button 
                            className="btn-icon text-muted hover:text-primary transition-colors" 
                            title="Editar"
                            onClick={() => handleEditFileClick(file)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="btn-icon text-muted hover:text-danger transition-colors" 
                            title="Excluir"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="docs-empty-state">
            Nenhum arquivo encontrado.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{(newFile as any).id ? 'Editar Link' : 'Novo Link de Arquivo'}</h2>
              <button onClick={() => { setShowAddModal(false); setNewFile({ name: '', category: categories.length > 0 ? categories[0].name : '', desc: '', unit: 'Geral', url: '' }); }} className="close-btn" disabled={uploading}>&times;</button>
            </div>
            <form onSubmit={handleAddFile} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Nome de Exibição (Como vai aparecer na tabela)</label>
                <input type="text" className="input-field" placeholder="Ex: POP Lavagem de Mãos" required
                  value={newFile.name} onChange={e => setNewFile({...newFile, name: e.target.value})} disabled={uploading} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Categoria</label>
                <select className="input-field" value={newFile.category} onChange={e => setNewFile({...newFile, category: e.target.value})} disabled={uploading}>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="Sem Categoria">Sem Categoria</option>}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Unidade</label>
                <select className="input-field" value={newFile.unit} onChange={e => setNewFile({...newFile, unit: e.target.value})} disabled={uploading}>
                  <option value="Geral">Geral (Aplicável a todas)</option>
                  {availableUnits.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Link do Arquivo (Google Drive, OneDrive, etc)</label>
                <input type="url" className="input-field" placeholder="Ex: https://drive.google.com/..." required
                  value={newFile.url} onChange={e => setNewFile({...newFile, url: e.target.value})} disabled={uploading} />
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Descrição Breve (Opcional)</label>
                <textarea className="input-field" rows={2}
                  value={newFile.desc} onChange={e => setNewFile({...newFile, desc: e.target.value})} disabled={uploading} />
              </div>
              
              <div className="flex gap-4">
                <button type="button" className="btn-secondary w-full" onClick={() => { setShowAddModal(false); setNewFile({ name: '', category: categories.length > 0 ? categories[0].name : 'Sem Categoria', desc: '', unit: 'Geral', url: '' }); }} disabled={uploading}>Cancelar</button>
                <button type="submit" className="btn-primary w-full" disabled={uploading}>
                  {uploading ? 'Aguarde...' : (newFile as any).id ? 'Salvar Alterações' : 'Salvar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Categoria */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editCategory ? 'Editar Pasta' : 'Nova Pasta'}</h2>
              <button onClick={() => setShowCatModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body">
              <div className="form-group mb-6">
                <label className="input-label">Nome da Pasta</label>
                <input type="text" className="input-field" required placeholder="Ex: Relatórios de Gestão"
                  value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              </div>
              
              <div className="flex gap-4">
                {editCategory && (
                  <button type="button" className="btn-secondary text-danger border-red-200 hover:bg-red-50 hover:border-red-300" onClick={handleDeleteCategory}>
                    Excluir
                  </button>
                )}
                <button type="button" className="btn-secondary w-full" onClick={() => setShowCatModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
