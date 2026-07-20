import React, { useState, useEffect } from 'react';
import { DownloadCloud, ChefHat, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './MandatoryDocReportModal.css';

interface Props {
  onClose: () => void;
  unitId?: string | number;
  unitName?: string;
}

const defaultDocs = [
  "Alvará de Funcionamento", "Licença Sanitária", "CNPJ", "Inscrição Estadual (quando aplicável)",
  "Contrato Social", "Licença do Corpo de Bombeiros (AVCB/CLC)", "Certificado de Desinsetização e Desratização",
  "Análise de Caixa d'Água", "Certificado de Limpeza de Caixa d'Água", "ASO (Atestado de Saúde Ocupacional)",
  "Lista de Presença dos Treinamentos", "Certificados", "Controle de Uniformes", "Cadastro de Fornecedores",
  "Licença Sanitária dos Fornecedores (quando aplicável)", "Certificados / Laudos", "Comprovante de Destinação de Resíduos",
  "Outros Documentos (especificar)"
].map((name, i) => ({
  id: i + 1, name, existe: false, dataEmissao: '', validade: '', status: '', obs: ''
}));

const defaultMaintenance = [
  "Dedetização / Controle de Pragas", "Limpeza de Caixa d'Água", "Limpeza de Calha",
  "Limpeza de Caixa de Gordura", "Manutenção de Refrigeradores", "Manutenção de Exaustores",
  "Manutenção de Extintores", "Outros (especificar)"
].map((name, i) => ({ id: i + 1, name, empresa: '', dataExec: '', proxExec: '', ok: false }));

const defaultWater = [
  "Análise de Potabilidade de Água", "Limpeza de Caixa d'Água", "Outros (especificar)"
].map((name, i) => ({ id: i + 1, name, data: '', validade: '', ok: false }));

const defaultEmployee = [
  "ASO (Atestado de Saúde Ocupacional)", "Temperatura em Banhos Marias", "Lista de Presença dos Treinamentos",
  "Certificados", "Controle de Uniformes", "Outros (especificar)"
].map((name, i) => ({ id: i + 1, name, data: '', validade: '', ok: false }));

const defaultSecurity = [
  "AVCB / CLCB (Corpo de Bombeiros)", "Extintores (Recarga em dia)", "Treinamento de Brigada",
  "Licença Sanitária", "Outros (especificar)"
].map((name, i) => ({ id: i + 1, name, validade1: '', validade2: '', ok: false }));

export default function MandatoryDocReportModal({ onClose, unitId, unitName }: Props) {
  const [docs, setDocs] = useState(defaultDocs);
  const [maintenance, setMaintenance] = useState(defaultMaintenance);
  const [water, setWater] = useState(defaultWater);
  const [employee, setEmployee] = useState(defaultEmployee);
  const [security, setSecurity] = useState(defaultSecurity);
  const [obs, setObs] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(!!unitId);

  useEffect(() => {
    if (unitId) {
      const loadDocs = async () => {
        try {
          const docRef = doc(db, 'reports_docs', String(unitId));
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.docs) setDocs(data.docs);
            if (data.maintenance) setMaintenance(data.maintenance);
            if (data.water) setWater(data.water);
            if (data.employee) setEmployee(data.employee);
            if (data.security) setSecurity(data.security);
            if (data.obs) setObs(data.obs);
            if (data.lastUpdated) setLastUpdated(data.lastUpdated);
          }
        } catch (error) {
          console.error("Erro ao carregar documento:", error);
        } finally {
          setLoading(false);
        }
      };
      loadDocs();
    } else {
      setLoading(false);
    }
  }, [unitId]);

  const updateDoc = (id: number, field: string, val: any) => {
    setDocs(docs.map((d: any) => {
      if (d.id === id) {
        const updated = { ...d, [field]: val };
        
        // Se a data de validade for alterada, calcular status automaticamente
        if (field === 'validade') {
          if (!val) {
            updated.status = '';
          } else {
            const parts = val.split('-');
            if (parts.length === 3) {
              const valDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const diffTime = valDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays < 0) updated.status = 'alert';
              else if (diffDays <= 30) updated.status = 'warn';
              else updated.status = 'ok';
            }
          }
        }
        return updated;
      }
      return d;
    }));
  };
  const updateMain = (id: number, field: string, val: any) => {
    setMaintenance(maintenance.map((d: any) => d.id === id ? { ...d, [field]: val } : d));
  };
  const updateWater = (id: number, field: string, val: any) => {
    setWater(water.map((d: any) => d.id === id ? { ...d, [field]: val } : d));
  };
  const updateEmp = (id: number, field: string, val: any) => {
    setEmployee(employee.map((d: any) => d.id === id ? { ...d, [field]: val } : d));
  };
  const updateSec = (id: number, field: string, val: any) => {
    setSecurity(security.map((d: any) => d.id === id ? { ...d, [field]: val } : d));
  };

  const handlePrint = () => {
    window.print();
  };

  const renderDateInput = (val: string, onChange: (v: string) => void) => (
    <input 
      type={val ? 'date' : 'text'}
      className="report-input text-center" 
      onFocus={(e) => e.target.type = 'date'}
      onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
      value={val} 
      onChange={e => onChange(e.target.value)} 
    />
  );

  const handleSaveAndClose = async () => {
    if (unitId) {
      const now = new Date().toLocaleString('pt-BR');
      setLastUpdated(now);
      const dataToSave = { docs, maintenance, water, employee, security, obs, lastUpdated: now };
      
      try {
        await setDoc(doc(db, 'reports_docs', String(unitId)), dataToSave);
      } catch (error) {
        console.error("Erro ao salvar documento:", error);
      }
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="doc-report-overlay">
        <div className="doc-report-modal flex items-center justify-center">
          <p className="text-muted">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-report-overlay">
      <div className="doc-report-modal">
        <div className="doc-report-header">
          <h2>CONTROLE DE DOCUMENTAÇÃO OBRIGATÓRIA</h2>
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint} className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <DownloadCloud size={18} />
              Exportar PDF
            </button>
            <button onClick={handleSaveAndClose} className="btn-primary">Salvar e Fechar</button>
            <button onClick={handleSaveAndClose} className="ml-2 text-gray-500 hover:text-gray-800 transition-colors" title="Fechar">
              <X size={28} />
            </button>
          </div>
        </div>
        
        {unitId && (
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="font-semibold text-gray-700">Unidade: <span className="text-primary">{unitName}</span></div>
            <div className="text-sm text-gray-500">
              Última atualização: {lastUpdated ? <span className="font-medium">{lastUpdated}</span> : <span className="italic text-gray-400">Nunca atualizado</span>}
            </div>
          </div>
        )}

        <div className="doc-report-body">
          
          {/* Print Only Header */}
          <div className="print-header hidden-on-screen">
            <div className="print-header-text">
              <h1>CONTROLE DE DOCUMENTAÇÃO OBRIGATÓRIA</h1>
              <h2>BAR & RESTAURANTE JOAQUINA</h2>
              <h3>PLANILHA DE GESTÃO PARA NUTRICIONISTAS E GERÊNCIA</h3>
              <div className="print-header-banner">
                CONFORME EXIGÊNCIAS DA ANVISA, VIGILÂNCIA SANITÁRIA, PROCON, CORPO DE BOMBEIROS E DEMAIS ÓRGÃOS FISCALIZADORES
              </div>
            </div>
            <div className="print-header-logo">
              <img src="/logo.png" alt="Joaquina" style={{width: '100px', objectFit: 'contain'}} />
            </div>
          </div>

          <div className="report-section">
            <div className="report-section-header">1. DOCUMENTAÇÃO OBRIGATÓRIA</div>
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{width: '3%'}}>Nº</th>
                  <th style={{width: '30%'}}>DOCUMENTO</th>
                  <th style={{width: '6%'}}>EXISTE</th>
                  <th style={{width: '12%'}}>DATA DE EMISSÃO</th>
                  <th style={{width: '12%'}}>VALIDADE</th>
                  <th style={{width: '5%'}} className="status-header-ok">OK</th>
                  <th style={{width: '6%'}} className="status-header-warn">ATENÇÃO</th>
                  <th style={{width: '6%'}} className="status-header-alert">VENCIDO</th>
                  <th>OBSERVAÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d: any, i: number) => (
                  <tr key={d.id}>
                    <td className="text-center font-bold text-gray-500">{i+1}</td>
                    <td><input type="text" className="report-input font-medium" value={d.name} onChange={e => updateDoc(d.id, 'name', e.target.value)} /></td>
                    <td className="text-center"><input type="checkbox" className="status-checkbox" checked={d.existe} onChange={e => updateDoc(d.id, 'existe', e.target.checked)} /></td>
                    <td>{renderDateInput(d.dataEmissao, (v) => updateDoc(d.id, 'dataEmissao', v))}</td>
                    <td>{renderDateInput(d.validade, (v) => updateDoc(d.id, 'validade', v))}</td>
                    <td className="text-center"><input type="radio" name={`status-${d.id}`} className="status-checkbox" checked={d.status === 'ok'} onChange={() => updateDoc(d.id, 'status', 'ok')} /></td>
                    <td className="text-center"><input type="radio" name={`status-${d.id}`} className="status-checkbox" checked={d.status === 'warn'} onChange={() => updateDoc(d.id, 'status', 'warn')} /></td>
                    <td className="text-center"><input type="radio" name={`status-${d.id}`} className="status-checkbox" checked={d.status === 'alert'} onChange={() => updateDoc(d.id, 'status', 'alert')} /></td>
                    <td><input type="text" className="report-input" value={d.obs} onChange={e => updateDoc(d.id, 'obs', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid-2-cols">
            <div className="report-section">
              <div className="report-section-header">2. CONTROLE DE MANUTENÇÕES E SERVIÇOS</div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{width: '40%'}}>ITEM</th>
                    <th style={{width: '24%'}}>EMPRESA RESPONSÁVEL</th>
                    <th style={{width: '15%'}}>DATA EXECUÇÃO</th>
                    <th style={{width: '15%'}}>PRÓX. EXECUÇÃO</th>
                    <th style={{width: '6%'}}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((m: any) => (
                    <tr key={m.id}>
                      <td><input type="text" className="report-input" value={m.name} onChange={e => updateMain(m.id, 'name', e.target.value)} /></td>
                      <td><input type="text" className="report-input" value={m.empresa} onChange={e => updateMain(m.id, 'empresa', e.target.value)} /></td>
                      <td>{renderDateInput(m.dataExec, (v) => updateMain(m.id, 'dataExec', v))}</td>
                      <td>{renderDateInput(m.proxExec, (v) => updateMain(m.id, 'proxExec', v))}</td>
                      <td className="text-center"><input type="checkbox" className="status-checkbox" checked={m.ok} onChange={e => updateMain(m.id, 'ok', e.target.checked)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-section">
              <div className="report-section-header">3. CONTROLE DE ÁGUA</div>
              <table className="report-table h-full">
                <thead>
                  <tr>
                    <th style={{width: '54%'}}>ITEM</th>
                    <th style={{width: '20%'}}>DATA</th>
                    <th style={{width: '20%'}}>VALIDADE</th>
                    <th style={{width: '6%'}}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {water.map((w: any) => (
                    <tr key={w.id}>
                      <td><input type="text" className="report-input" value={w.name} onChange={e => updateWater(w.id, 'name', e.target.value)} /></td>
                      <td>{renderDateInput(w.data, (v) => updateWater(w.id, 'data', v))}</td>
                      <td>{renderDateInput(w.validade, (v) => updateWater(w.id, 'validade', v))}</td>
                      <td className="text-center"><input type="checkbox" className="status-checkbox" checked={w.ok} onChange={e => updateWater(w.id, 'ok', e.target.checked)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2-cols">
            <div className="report-section">
              <div className="report-section-header">4. CONTROLE DOS FUNCIONÁRIOS</div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{width: '54%'}}>DOCUMENTO / REGISTRO</th>
                    <th style={{width: '20%'}}>DATA</th>
                    <th style={{width: '20%'}}>VALIDADE</th>
                    <th style={{width: '6%'}}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.map((e: any) => (
                    <tr key={e.id}>
                      <td><input type="text" className="report-input" value={e.name} onChange={ev => updateEmp(e.id, 'name', ev.target.value)} /></td>
                      <td>{renderDateInput(e.data, (v) => updateEmp(e.id, 'data', v))}</td>
                      <td>{renderDateInput(e.validade, (v) => updateEmp(e.id, 'validade', v))}</td>
                      <td className="text-center"><input type="checkbox" className="status-checkbox" checked={e.ok} onChange={ev => updateEmp(e.id, 'ok', ev.target.checked)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-section">
              <div className="report-section-header">5. SEGURANÇA E LICENÇAS</div>
              <table className="report-table h-full">
                <thead>
                  <tr>
                    <th style={{width: '54%'}}>DOCUMENTO / REGISTRO</th>
                    <th style={{width: '20%'}}>VALIDADE</th>
                    <th style={{width: '20%'}}>VALIDADE</th>
                    <th style={{width: '6%'}}>OK</th>
                  </tr>
                </thead>
                <tbody>
                  {security.map((s: any) => (
                    <tr key={s.id}>
                      <td><input type="text" className="report-input" value={s.name} onChange={e => updateSec(s.id, 'name', e.target.value)} /></td>
                      <td>{renderDateInput(s.validade1, (v) => updateSec(s.id, 'validade1', v))}</td>
                      <td>{renderDateInput(s.validade2, (v) => updateSec(s.id, 'validade2', v))}</td>
                      <td className="text-center"><input type="checkbox" className="status-checkbox" checked={s.ok} onChange={e => updateSec(s.id, 'ok', e.target.checked)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-section">
            <div className="report-section-header">6. OBSERVAÇÕES / AÇÕES NECESSÁRIAS</div>
            <textarea 
              className="textarea-full" 
              placeholder="Digite suas observações gerais aqui..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="report-legend">
            <div className="legend-item"><div className="legend-color bg-ok"></div> OK = Conforme</div>
            <div className="legend-item"><div className="legend-color bg-warn"></div> ATENÇÃO = Regularizar em breve</div>
            <div className="legend-item"><div className="legend-color bg-alert"></div> VENCIDO = Ação imediata necessária</div>
          </div>

        </div>
        <div className="doc-report-footer">
          <button onClick={handlePrint} className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <DownloadCloud size={18} />
            Exportar PDF
          </button>
          <button className="btn-primary" onClick={handleSaveAndClose}>Salvar e Fechar</button>
        </div>
      </div>
    </div>
  );
}
