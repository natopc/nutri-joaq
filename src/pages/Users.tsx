import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User, Role } from '../context/AuthContext';
import { UserPlus, Trash2, Mail, User as UserIcon, Shield, Edit2 } from 'lucide-react';
import './Users.css';

const defaultUsers: User[] = [
  { id: '1', name: 'João Admin', email: 'admin@nutrijoaq.com', role: 'admin', cargo: 'Nutricionista Chefe' },
  { id: '2', name: 'Maria Estagiária', email: 'maria@nutrijoaq.com', role: 'viewer', cargo: 'Estagiária' },
  { id: '3', name: 'Pedro Silva', email: 'pedro@nutrijoaq.com', role: 'viewer', cargo: 'Técnico de Qualidade' }
];

export default function Users() {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('nutriJoaq_users');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { return defaultUsers; }
    }
    return defaultUsers;
  });

  useEffect(() => {
    localStorage.setItem('nutriJoaq_users', JSON.stringify(users));
  }, [users]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', role: 'viewer' as Role, cargo: '' });

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', role: 'viewer', cargo: '' });
    setEditUser(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setFormData({ name: u.name, email: u.email, role: u.role, cargo: u.cargo || '' });
    setEditUser(u);
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...formData } : u));
    } else {
      setUsers([...users, { id: Math.random().toString(), ...formData }]);
    }
    setShowAddModal(false);
    setEditUser(null);
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Usuários</h1>
          <p className="page-subtitle">Controle de acesso à plataforma.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="card users-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Nível de Acesso</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{u.name.charAt(0)}</div>
                    <span className="font-semibold">{u.name}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-muted">
                    <Mail size={16} />
                    {u.email}
                  </div>
                </td>
                <td>{u.cargo || '-'}</td>
                <td>
                  {u.role === 'admin' ? (
                    <span className="badge badge-admin"><Shield size={14} /> Admin (Leitura e Escrita)</span>
                  ) : (
                    <span className="badge badge-viewer"><UserIcon size={14} /> Leitor (Somente Leitura)</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="btn-icon" title="Editar" onClick={() => handleOpenEdit(u)}>
                      <Edit2 size={18} />
                    </button>
                    {currentUser?.id !== u.id && (
                      <button className="btn-icon text-danger" title="Excluir" onClick={() => removeUser(u.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveUser} className="modal-body">
              <div className="form-group mb-4">
                <label className="input-label">Nome Completo</label>
                <input type="text" className="input-field" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">E-mail</label>
                <input type="email" className="input-field" required 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="input-label">Cargo</label>
                <input type="text" className="input-field" placeholder="Ex: Estagiário, Nutricionista..."
                  value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} />
              </div>
              <div className="form-group mb-6">
                <label className="input-label">Nível de Acesso</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                  <option value="viewer">Visualizador (Somente Leitura)</option>
                  <option value="admin">Administrador (Leitura e Escrita)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary w-full">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
