import { useState, useEffect } from 'react';
import { X, DownloadCloud } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './MandatoryDocReportModal.css';

interface Props {
  onClose: () => void;
  unitId?: number | string;
  unitName?: string;
}

const defaultChecklist = [
  // 1. DOCUMENTAÇÃO, ÁGUA E ESTRUTURA GERAL
  { id: 1, category: 1, text: "Produtos de limpeza de empresas homologadas pela rede, registrados no MS e livres de odores", status: '', obs: '' },
  { id: 2, category: 1, text: "Presença de diluidor para produtos homologados devidamente abastecido", status: '', obs: '' },
  { id: 3, category: 1, text: "Lixeiras com acionamento por pedal, forradas com sacos plásticos e mantidas fechadas", status: '', obs: '' },
  { id: 4, category: 1, text: "Perfeitas condições de conservação e limpeza das lixeiras (sem contaminação cruzada)", status: '', obs: '' },
  { id: 5, category: 1, text: "Ralos sifonados protegidos e limpos (bloqueio contra insetos e odores)", status: '', obs: '' },
  { id: 6, category: 1, text: "Luminárias limpas e devidamente protegidas contra explosões e quedas de resíduos", status: '', obs: '' },
  { id: 7, category: 1, text: "Aberturas e janelas totalmente protegidas por telas milimétricas limpas e íntegras", status: '', obs: '' },
  { id: 8, category: 1, text: "Presença de relógio de parede em perfeito funcionamento na área de produção", status: '', obs: '' },
  { id: 9, category: 1, text: "Disponibilidade e produção contínua de água quente na área de lavagem", status: '', obs: '' },
  { id: 10, category: 1, text: "Ausência de vazamentos ou infiltrações em conexões, pias e tubulações", status: '', obs: '' },
  { id: 11, category: 1, text: "Conservação e limpeza geral das instalações da cozinha, copa e estoques", status: '', obs: '' },
  
  // 2. SANITÁRIOS, VESTIÁRIOS E DML
  { id: 12, category: 2, text: "Instalações sanitárias e vestiários dos funcionários organizados e limpos", status: '', obs: '' },
  { id: 13, category: 2, text: "Sanitário completo: papel higiênico, sabonete líquido anti-séptico, papel toalha e lixeira com pedal", status: '', obs: '' },
  { id: 14, category: 2, text: "Papeleiras e saboneteiras limpas, abastecidas e em perfeito estado de conservação", status: '', obs: '' },
  { id: 15, category: 2, text: "Área isolada e exclusiva para o armazenamento de produtos e insumos de limpeza (DML)", status: '', obs: '' },
  
  // 3. EQUIPAMENTOS DE REFRIGERAÇÃO E CLIMATIZAÇÃO
  { id: 16, category: 3, text: "Conservação geral dos equipamentos de refrigeração (câmaras, geladeiras e balcões)", status: '', obs: '' },
  { id: 17, category: 3, text: "Borrachas de vedação íntegras garantindo a hermeticidade correta dos equipamentos", status: '', obs: '' },
  { id: 18, category: 3, text: "Câmaras, geladeiras e balcões limpos interna e externamente (sem resíduos ou fungos)", status: '', obs: '' },
  { id: 19, category: 3, text: "Descongelamento de alimentos executado de forma correta e segura (sob refrigeração)", status: '', obs: '' },
  { id: 20, category: 3, text: "Temperatura das geladeiras rigorosamente entre 0°C e 4°C (tolerável até 5°C)", status: '', obs: '' },
  { id: 21, category: 3, text: "Temperatura dos freezers a -18°C ou inferior (tolerável até -12°C)", status: '', obs: '' },

  // 4. MANIPULAÇÃO DE ALIMENTOS, PROCESSOS E CONTROLE DE PRAGAS
  { id: 22, category: 4, text: "Higienização adequada e correta de hortifrutis (etapa de lavagem e sanitização química)", status: '', obs: '' },
  { id: 23, category: 4, text: "Uso correto e troca frequente de luvas descartáveis conforme a atividade executada", status: '', obs: '' },
  { id: 24, category: 4, text: "Controle de Estoque eficiente seguindo o critério PVPS (Primeiro que Vence, Primeiro que Sai)", status: '', obs: '' },
  { id: 25, category: 4, text: "Ausência de alimentos, caixas ou insumos em contato direto com o piso (uso de estrados)", status: '', obs: '' },
  { id: 26, category: 4, text: "Ausência de alimentos perecíveis fora da refrigeração por período superior a 30 minutos", status: '', obs: '' },
  { id: 27, category: 4, text: "Ausência completa de vetores e pragas urbanas (ou qualquer indício de presença)", status: '', obs: '' },
  { id: 28, category: 4, text: "Proteção adequada de todos os alimentos contra contaminações físicas, químicas ou biológicas", status: '', obs: '' },
  { id: 29, category: 4, text: "Ausência de sacolas plásticas recicladas em contato direto com alimentos", status: '', obs: '' },
  { id: 30, category: 4, text: "Ausência de vassoura de piaçava sem revestimento nas áreas de manipulação", status: '', obs: '' },
  { id: 31, category: 4, text: "Ausência de alimentos deteriorados, alterados ou com prazo de validade expirado", status: '', obs: '' },
  { id: 32, category: 4, text: "Proibição da reutilização de embalagens vazias de fornecedores para guardar alimentos", status: '', obs: '' },
  { id: 33, category: 4, text: "Uso correto e descarte adequado de panos descartáveis multiuso", status: '', obs: '' },
  { id: 34, category: 4, text: "Pia de higienização das mãos na produção completa (sabonete, antisséptico e toalha)", status: '', obs: '' },
  { id: 35, category: 4, text: "Ausência total de caixas de papelão ou madeira nas áreas de preparo (exceto no recebimento)", status: '', obs: '' },

  // 5. EQUIPAMENTOS, UTENSÍLIOS E ÁREAS DE APOIO
  { id: 36, category: 5, text: "Conservação e limpeza dos mobiliários de apoio (prateleiras, estantes e bancadas)", status: '', obs: '' },
  { id: 37, category: 5, text: "Conservação e limpeza geral de todos os utensílios operacionais", status: '', obs: '' },
  { id: 38, category: 5, text: "Conservação e limpeza dos equipamentos de apoio (cortador de frios, liquidificadores, etc.)", status: '', obs: '' },
  { id: 39, category: 5, text: "Máquina de lavar louças limpa interna e externamente (e operando na temperatura correta)", status: '', obs: '' },
  { id: 40, category: 5, text: "Caixas brancas vazadas e monoblocos devidamente limpos e higienizados", status: '', obs: '' },
  { id: 41, category: 5, text: "Estrados da loja limpos e em perfeitas condições de uso", status: '', obs: '' },
  { id: 42, category: 5, text: "Armazenamento correto e seguro de todos os equipamentos após o término do uso", status: '', obs: '' },
  { id: 43, category: 5, text: "Coifas e filtros do sistema de exaustão completamente limpos (sem acúmulo de gordura)", status: '', obs: '' },
  { id: 44, category: 5, text: "Fogão, chapa, fritadeiras, cestos e balcão térmico perfeitamente limpos e conservados", status: '', obs: '' },
];

export default function PendenciesReportModal({ onClose, unitId, unitName }: Props) {
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [dataReport, setDataReport] = useState('');
  const [respName, setRespName] = useState('');
  const [loading, setLoading] = useState(!!unitId);

  useEffect(() => {
    if (unitId) {
      const loadData = async () => {
        try {
          const docRef = doc(db, 'reports_pendencies', String(unitId));
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.checklist) {
              setChecklist(defaultChecklist.map(defaultItem => {
                const found = data.checklist.find((s: any) => s.id === defaultItem.id);
                if (found) {
                  return { ...defaultItem, status: found.status, obs: found.obs };
                }
                return defaultItem;
              }));
            }
            if (data.dataReport) setDataReport(data.dataReport);
            if (data.dataReport) setDataReport(data.dataReport);
            if (data.respName) setRespName(data.respName);
          }
        } catch (error) {
          console.error("Erro ao carregar documento:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [unitId]);

  const updateStatus = (id: number, val: string) => {
    setChecklist(checklist.map((item: any) => item.id === id ? { ...item, status: val } : item));
  };

  const updateItemText = (id: number, text: string) => {
    setChecklist(checklist.map((item: any) => item.id === id ? { ...item, text } : item));
  };

  const updateItemObs = (id: number, obs: string) => {
    setChecklist(checklist.map((item: any) => item.id === id ? { ...item, obs } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndClose = async () => {
    if (unitId) {
      const now = new Date().toLocaleString('pt-BR');
      const dataToSave = { checklist, dataReport, respName, lastUpdated: now };
      
      try {
        await setDoc(doc(db, 'reports_pendencies', String(unitId)), dataToSave);
        
        // Push to real history for Vistorias tab
        const getWeekNumber = (d: Date) => {
          d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          return Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        };

        const simCount = checklist.filter((i: any) => i.status === 'SIM').length;
        const naoCount = checklist.filter((i: any) => i.status === 'NÃO').length;
        const total = simCount + naoCount;
        const conformity = total > 0 ? Math.round((simCount / total) * 100) : 0;

        const dateKey = (dataReport || now.split(',')[0]).replace(/\//g, '-');
        const docId = `unit_${unitId}_date_${dateKey}`;
        
        await setDoc(doc(db, 'reports_inspections', docId), {
          unit: unitName,
          week: `Semana ${getWeekNumber(new Date())}`,
          date: dataReport || now.split(',')[0],
          auditor: respName || 'Não Informado',
          score: `${conformity}%`,
          relatorioCompleto: `Relatório do Checklist Diário salvo. Total de itens avaliados: ${total}. Conformes: ${simCount}. Não conformes: ${naoCount}. Conformidade: ${conformity}%.`,
          createdAt: now
        });
      } catch (error) {
        console.error("Erro ao salvar documento:", error);
      }
    }
    onClose();
  };

  const simCount = checklist.filter((i: any) => i.status === 'SIM').length;
  const naoCount = checklist.filter((i: any) => i.status === 'NÃO').length;
  const totalAnswered = simCount + naoCount;
  const conformityPercentage = totalAnswered > 0 ? Math.round((simCount / totalAnswered) * 100) : 0;

  const renderCategory = (catId: number, title: string) => {
    const items = checklist.filter((i: any) => i.category === catId);
    return (
      <div className="report-section mb-6">
        <div className="section-header" style={{backgroundColor: '#D15200', color: 'white', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase'}}>
          {catId}. {title}
        </div>
        <table className="report-table w-full" style={{borderCollapse: 'collapse', fontSize: '0.85rem'}}>
          <tbody style={{backgroundColor: '#fff'}}>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td style={{ width: '4%', textAlign: 'center', border: '1px solid #e2e8f0', padding: '0.5rem', color: '#64748b' }}>
                  {item.id}
                </td>
                <td style={{ width: '56%', border: '1px solid #e2e8f0', padding: '0.5rem' }}>
                  <input 
                    type="text"
                    className="report-input w-full bg-transparent"
                    style={{ outline: 'none' }}
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                  />
                </td>
                <td className="text-center" style={{ width: '5%', border: '1px solid #e2e8f0' }}>
                  <input type="radio" style={{width: '18px', height: '18px', accentColor: '#D15200'}} name={`item-${item.id}`} checked={item.status === 'SIM'} onChange={() => updateStatus(item.id, 'SIM')} />
                </td>
                <td className="text-center" style={{ width: '5%', border: '1px solid #e2e8f0' }}>
                  <input type="radio" style={{width: '18px', height: '18px', accentColor: '#D15200'}} name={`item-${item.id}`} checked={item.status === 'NÃO'} onChange={() => updateStatus(item.id, 'NÃO')} />
                </td>
                <td style={{ width: '30%', border: '1px solid #e2e8f0', padding: '0.2rem' }}>
                  <input 
                    type="text"
                    className="report-input w-full h-full bg-transparent"
                    style={{ outline: 'none', padding: '0.3rem', backgroundColor: '#fafafa', border: '1px solid #f1f5f9', borderRadius: '4px' }}
                    placeholder="Observações..."
                    value={item.obs || ''}
                    onChange={(e) => updateItemObs(item.id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="doc-report-overlay">
        <div className="doc-report-modal flex justify-center items-center" style={{ maxWidth: '1000px', backgroundColor: '#f8fafc' }}>
           <p className="text-muted">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-report-overlay">
      <div className="doc-report-modal" style={{ maxWidth: '1000px', backgroundColor: '#f8fafc' }}>
        <div className="doc-report-header bg-white">
          <h2>CHECKLIST DE VERIFICAÇÃO DIÁRIA</h2>
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint} className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <DownloadCloud size={18} />
              Exportar / Imprimir
            </button>
            <button onClick={handleSaveAndClose} className="btn-primary" style={{backgroundColor: '#D15200'}}>Salvar e Fechar</button>
            <button onClick={handleSaveAndClose} className="ml-2 text-gray-500 hover:text-gray-800 transition-colors" title="Fechar">
              <X size={28} />
            </button>
          </div>
        </div>

        <div className="doc-report-body" style={{ padding: '2rem' }}>
          
          {/* Cabeçalho no Padrão do PDF */}
          <div className="bg-white p-4 mb-6" style={{border: '1px solid #e2e8f0'}}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col items-center">
                <div style={{width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9'}}>
                  <img src="/logo.png" alt="Logo" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                </div>
                <div className="font-bold tracking-widest text-sm">JOAQUINA</div>
              </div>
              <div className="text-center flex-1 ml-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">CHECKLIST DE VERIFICAÇÃO DIÁRIA</h1>
                <h2 className="text-xl font-bold tracking-wide" style={{color: '#D15200'}}>CONTROLE DE QUALIDADE</h2>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-sm" style={{backgroundColor: '#FFFaf0', padding: '1rem', border: '1px solid #fce7f3'}}>
              <div className="flex items-center gap-2">
                <span className="font-bold">Data:</span>
                <input type="text" className="border-b border-gray-400 bg-transparent flex-1 outline-none px-2" placeholder="__/__/____" value={dataReport} onChange={e => setDataReport(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Unidade:</span>
                <span className="border-b border-gray-400 bg-transparent flex-1 px-2 font-medium text-gray-700">{unitName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Responsável (Nutricionista):</span>
                <input type="text" className="border-b border-gray-400 bg-transparent flex-1 outline-none px-2" value={respName} onChange={e => setRespName(e.target.value)} />
              </div>
            </div>
          </div>

          <table className="w-full mb-2" style={{fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0'}}>
            <thead>
              <tr>
                <td style={{ width: '4%', textAlign: 'center', padding: '0.5rem' }}>Nº</td>
                <td style={{ width: '56%', padding: '0.5rem' }}>ITEM DE VERIFICAÇÃO (ESTRUTURA, PROCESSOS E HIGIENE)</td>
                <td className="text-center" style={{ width: '5%', padding: '0.5rem' }}>SIM</td>
                <td className="text-center" style={{ width: '5%', padding: '0.5rem' }}>NÃO</td>
                <td style={{ width: '30%', padding: '0.5rem' }}>OBSERVAÇÕES</td>
              </tr>
            </thead>
          </table>

          {renderCategory(1, "Documentação, Água e Estrutura Geral")}
          {renderCategory(2, "Sanitários, Vestiários e DML")}
          {renderCategory(3, "Equipamentos de Refrigeração e Climatização")}
          {renderCategory(4, "Manipulação de Alimentos, Processos e Controle de Pragas")}
          {renderCategory(5, "Equipamentos, Utensílios e Áreas de Apoio")}

          <div className="report-section mt-8 p-6 bg-white" style={{ border: '2px solid #D15200', borderRadius: '8px' }}>
            <h3 className="font-bold text-lg mb-4" style={{color: '#D15200'}}>Desempenho da Unidade</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Itens avaliados: <strong className="text-gray-800">{totalAnswered}</strong> de 44</p>
                <p className="text-gray-600 mb-1">Conformes (SIM): <strong className="text-green-600">{simCount}</strong></p>
                <p className="text-gray-600">Não Conformes (NÃO): <strong className="text-red-600">{naoCount}</strong></p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Índice de Conformidade</div>
                <div className="text-5xl font-black" style={{color: conformityPercentage >= 90 ? '#16a34a' : conformityPercentage >= 80 ? '#eab308' : '#dc2626'}}>
                  {conformityPercentage}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-12 pt-8" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="text-center flex-1 px-8">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <div className="text-sm font-bold text-gray-600">Assinatura do Responsável Técnico / Nutricionista</div>
            </div>
            <div className="text-center flex-1 px-8">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <div className="text-sm font-bold text-gray-600">Assinatura do Gerente / Responsável da Unidade</div>
            </div>
          </div>

        </div>

        <div className="doc-report-footer flex justify-end p-4 border-t border-gray-200 bg-white">
          <button onClick={handlePrint} className="btn-secondary mr-2" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <DownloadCloud size={18} />
            Exportar PDF
          </button>
          <button className="btn-primary" onClick={handleSaveAndClose} style={{backgroundColor: '#D15200'}}>Salvar e Fechar</button>
        </div>
      </div>
    </div>
  );
}
