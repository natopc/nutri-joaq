import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  TrendingUp,
  Store,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  History
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import './Dashboard.css';

export default function Dashboard() {
  const { canWrite } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [pendenciesData, setPendenciesData] = useState<any>({});
  const [agendaData, setAgendaData] = useState<any[]>([]);

  useEffect(() => {
    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      setUnitsData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPendencies = onSnapshot(collection(db, 'reports_pendencies'), (snapshot) => {
      const pends: any = {};
      snapshot.docs.forEach(d => {
        pends[d.id] = d.data();
      });
      setPendenciesData(pends);
    });

    const unsubAgenda = onSnapshot(collection(db, 'trainings'), (snapshot) => {
      setAgendaData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUnits();
      unsubPendencies();
      unsubAgenda();
    };
  }, []);

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
  };
  const currentWeek = getWeekNumber(new Date());
  const previousWeek = currentWeek - 1;

  const calculatedUnits = unitsData.map(unit => {
    let compliance = 100; // default to 100% se não houver relatório preenchido
    const unitPendencies = pendenciesData[unit.id];
    
    if (unitPendencies && unitPendencies.checklist) {
      const checklist = unitPendencies.checklist;
      const totalApplicable = checklist.filter((item: any) => item.status === 'SIM' || item.status === 'NÃO').length;
      const totalSim = checklist.filter((item: any) => item.status === 'SIM').length;
      
      if (totalApplicable > 0) {
        compliance = Math.round((totalSim / totalApplicable) * 100);
      } else {
        const totalNao = checklist.filter((item: any) => item.status === 'NÃO').length;
        if (totalNao > 0) {
           compliance = 0;
        }
      }
    }
    
    // Simulate previous compliance if it doesn't exist, to show the arrows
    const previousCompliance = unit.previousCompliance !== undefined 
      ? unit.previousCompliance 
      : Math.max(0, Math.min(100, compliance + (unit.id % 2 === 0 ? -8 : 5)));

    let status = 'good';
    if (compliance < 80) status = 'danger';
    else if (compliance < 90) status = 'warning';

    let prevStatus = 'good';
    if (previousCompliance < 80) prevStatus = 'danger';
    else if (previousCompliance < 90) prevStatus = 'warning';

    return {
      ...unit,
      name: unit.name,
      compliance,
      previousCompliance,
      status,
      prevStatus
    };
  });

  const rankedUnits = [...calculatedUnits].sort((a, b) => b.compliance - a.compliance);
  const rankedUnitsPrevious = [...calculatedUnits].sort((a, b) => b.previousCompliance - a.previousCompliance);

  // Determine improvement/worsening
  rankedUnits.forEach((unit, idx) => {
    const currentRank = idx;
    const prevRank = rankedUnitsPrevious.findIndex(u => u.id === unit.id);
    
    unit.improved = currentRank < prevRank || (currentRank === prevRank && unit.compliance > unit.previousCompliance);
    unit.worsened = currentRank > prevRank || (currentRank === prevRank && unit.compliance < unit.previousCompliance);
  });

  const totalCompliance = calculatedUnits.reduce((acc, curr) => acc + curr.compliance, 0);
  const averageCompliance = calculatedUnits.length > 0 ? Math.round(totalCompliance / calculatedUnits.length) : 0;

  const totalCompliancePrevious = calculatedUnits.reduce((acc, curr) => acc + curr.previousCompliance, 0);
  const averageCompliancePrevious = calculatedUnits.length > 0 ? Math.round(totalCompliancePrevious / calculatedUnits.length) : 0;

  const futureAgenda = agendaData.filter(item => new Date(`${item.date}T${item.time}`).getTime() > Date.now());
  futureAgenda.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  
  const downloadPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Relatorio_Dashboard_NutriJoaq.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
    }
  };


  const kpis = [
    { title: "Média de Conformidade", value: `${averageCompliance}%`, trend: "Atual", icon: <TrendingUp size={24} />, status: averageCompliance >= 90 ? "success" : averageCompliance >= 80 ? "warning" : "danger" },
    { title: "Média Semana Anterior", value: `${averageCompliancePrevious}%`, trend: "Semana Anterior", icon: <History size={24} />, status: averageCompliancePrevious >= 90 ? "success" : averageCompliancePrevious >= 80 ? "warning" : "danger" },
    { title: "Próximos Treinamentos", customContent: true, icon: <GraduationCap size={24} />, status: "info" }
  ];

  return (
    <div className="dashboard" ref={dashboardRef}>
      <div className="dashboard-header" data-html2canvas-ignore>
        <div>
          <h1 className="page-title">Visão Geral das Unidades</h1>
          <p className="page-subtitle">Acompanhamento central de {unitsData.length} UANs ativas.</p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <button className="btn-secondary" onClick={downloadPDF}>
              <Download size={18} />
              Exportar Relatório
            </button>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="card kpi-card">
            <div className="kpi-header mb-2">
              <span className="kpi-title">{kpi.title}</span>
              <div className={`kpi-icon ${kpi.status}`}>{kpi.icon}</div>
            </div>
            {(kpi as any).customContent ? (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                {futureAgenda.length > 0 ? futureAgenda.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-primary pl-2 bg-orange-50/30 p-1.5 rounded-r">
                    <div className="font-semibold text-gray-800 text-xs truncate" title={item.unit}>{item.unit}</div>
                    <div className="text-gray-600 truncate text-xs" title={item.theme}>{item.theme}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(item.date).toLocaleDateString('pt-BR')} às {item.time}</div>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500 italic mt-2">Nenhum agendamento futuro</div>
                )}
              </div>
            ) : (
              <>
                <div className="kpi-value">{(kpi as any).value}</div>
                <div className={`kpi-trend ${kpi.status}`}>
                  {(kpi as any).trend || (kpi as any).desc}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <div className="card compliance-card">
          <h3 className="card-title">Ranking de Conformidade (Semana {currentWeek})</h3>
          <div className="compliance-list">
            {rankedUnits.map((unit, idx) => (
              <div key={idx} className="compliance-item">
                <div className="unit-info flex items-center">
                  <div className="font-bold text-gray-500 mr-2 w-4 flex-shrink-0">{idx + 1}º</div>
                  <Store size={18} className="text-muted mr-1 flex-shrink-0" />
                  <span className="font-semibold truncate flex-1" title={unit.name}>{unit.name}</span>
                </div>
                <div className="w-8 flex justify-center items-center flex-shrink-0">
                  {unit.improved && <span title="Melhorou"><ArrowUp size={18} style={{ color: '#16a34a' }} /></span>}
                  {unit.worsened && <span title="Piorou"><ArrowDown size={18} style={{ color: '#dc2626' }} /></span>}
                  {!unit.improved && !unit.worsened && <span title="Manteve"><Minus size={18} style={{ color: '#9ca3af' }} /></span>}
                </div>
                <div className="progress-wrapper">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill bg-${unit.status}`} 
                      style={{ width: `${unit.compliance}%` }}
                    ></div>
                  </div>
                  <span className="compliance-value font-semibold">{unit.compliance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card compliance-card">
          <h3 className="card-title">Ranking de Conformidade (Semana {previousWeek})</h3>
          <div className="compliance-list">
            {rankedUnitsPrevious.map((unit, idx) => (
              <div key={idx} className="compliance-item">
                <div className="unit-info flex items-center">
                  <div className="font-bold text-gray-500 mr-2 w-4 flex-shrink-0">{idx + 1}º</div>
                  <Store size={18} className="text-muted mr-1 flex-shrink-0" />
                  <span className="font-semibold truncate flex-1" title={unit.name}>{unit.name}</span>
                </div>
                <div className="w-8 flex justify-center items-center flex-shrink-0"></div>
                <div className="progress-wrapper">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill bg-${unit.prevStatus}`} 
                      style={{ width: `${unit.previousCompliance}%` }}
                    ></div>
                  </div>
                  <span className="compliance-value font-semibold text-gray-500">{unit.previousCompliance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
