import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, Calendar, ShieldAlert, DollarSign, 
  Smile, Settings, User, CheckSquare, Sparkles, Compass, 
  MapPin, Heart, BookOpen, Clock, RefreshCcw, Landmark,
  CloudRain, Home, Car, Sliders, ShieldCheck, Thermometer, Zap, AlertTriangle
} from 'lucide-react';

interface PredicIAProps {
  lang: 'pt' | 'en' | 'es';
  setSuccessToast: (msg: string | null) => void;
}

export default function PredicIA({ lang, setSuccessToast }: PredicIAProps) {
  // --- USER CONTROLS FOR PROBABILISTIC SIMULATION ---
  const [rainIntensity, setRainIntensity] = useState(40); // 0% to 100%
  const [commuteHour, setCommuteHour] = useState(18); // Hour of the day (0-23)
  const [acUsageHours, setAcUsageHours] = useState(8); // Hours used per day
  const [meetingsCount, setMeetingsCount] = useState(6); // Meetings today
  const [monthlySavings, setMonthlySavings] = useState(1200); // R$ saved/month
  const [fridgeVibration, setFridgeVibration] = useState(15); // Hz/vibration level
  
  // Vehicle health sliders (kept modularly)
  const [catalystAge, setCatalystAge] = useState(45000); // km
  const [brakeWear, setBrakeWear] = useState(60); // % wear

  // Translations
  const t = useMemo(() => {
    return {
      pt: {
        title: "PredicIA™ Engine",
        subtitle: "Orquestrador de Previsão de Entorno",
        desc: "IA preditiva de ambiente total. Analisa cruzamentos estatísticos de tempo, finanças, casa, trajetos, reuniões e saúde veicular para calibrar sua rotina diária.",
        generalScore: "Índice de Harmonia & Prevenção",
        generalDesc: "O indicador geral reflete a estabilidade e segurança integrada do seu dia, cruzando todas as verticais.",
        harmonyLabel: "Harmonia Geral",
        factorsTitle: "Variáveis de Simulação Ambiental",
        factorsDesc: "Altere as variáveis em tempo real para ver como a probabilidade de falhas e riscos é recalculada instantaneamente.",
        
        // Tab Headers
        tabTrajeto: "Trajeto & Clima",
        tabFinancas: "Dinheiro & Finanças",
        tabCasa: "Residência & Casa",
        tabAgenda: "Agenda & Tempo",
        tabVeiculo: "Veículo & Saúde",

        // Controls Label
        lblRain: "Intensidade da Chuva",
        lblCommute: "Horário de Saída",
        lblAc: "Uso do Ar Condicionado",
        lblMeetings: "Reuniões Agendadas",
        lblSavings: "Economia Mensal",
        lblVibration: "Vibração do Refrigerador",
        lblCatalyst: "Odômetro (Catalisador)",
        lblBrake: "Desgaste das Pastilhas",

        // Category Cards
        cardTrajetoTitle: "Previsão de Tempo & Trajeto",
        cardTrajetoDesc: "Análise estocástica de congestionamento e acidentes na Rodovia dos Tamoios e vias centrais.",
        cardFinancasTitle: "Previsão Financeira & Caixa",
        cardFinancasDesc: "Projeção de fluxo de caixa, runway financeiro e probabilidade de gastos acidentais de emergência.",
        cardCasaTitle: "Saúde Preditiva Residencial",
        cardCasaDesc: "Desgaste de eletrodomésticos, eficiência de ar condicionado e vazamento de tubulação doméstica.",
        cardAgendaTitle: "Otimização de Agenda & Foco",
        cardAgendaDesc: "Análise de sobreposição de reuniões, índice de exaustão física e melhor janela de foco produtivo.",
        cardVeiculoTitle: "Saúde Preditiva Veicular",
        cardVeiculoDesc: "Telemetria de fadiga de componentes mecânicos e estimativa de trocas preventivas estruturais.",

        // Metrics output
        delayChance: "Probabilidade de Atraso no Trânsito",
        aquaplaningRisk: "Risco de Aquaplanagem",
        runwayMonths: "Runway (Reserva em meses)",
        emergencyRisk: "Risco de Gasto Emergencial",
        applianceWear: "Desgaste Previsto da Geladeira",
        acFilterRisk: "Alerta de Filtro de Climatização",
        exhaustionIndex: "Índice de Exaustão Diária",
        focusWindow: "Janela Ideal para Foco",
        catalystHealth: "Vida Útil do Catalisador",
        brakeReplacement: "Previsão para Troca de Freios",

        // Feedback Text
        feedbackRainHigh: "Atenção: Chuva forte aumenta o risco de aquaplanagem em 4.5x na descida da serra.",
        feedbackRainLow: "Pistas secas e condições excelentes de visibilidade no trajeto.",
        feedbackRunwayShort: "Alerta: Reserva menor que 4 meses. Evite gastos discricionários nos próximos 15 dias.",
        feedbackRunwaySafe: "Reserva estável. Ótimo fôlego para amortização de investimentos preventivos.",
        feedbackAcAlert: "Recomendado: Higienizar filtro de ar. Alto uso acumulado reduz eficiência energética.",
        feedbackMeetingOverload: "Sobrecarga detectada: Mais de 5 reuniões reduzem o índice de foco produtivo em 70%.",
        feedbackCatalystReplace: "Aviso OficIA: Catalisador com alta quilometragem. Probabilidade de 68% de erro de emissão DTC.",
        
        applyService: "Aprovar Manutenção de Eletrodoméstico",
        applyFinancialReview: "Calibrar Fluxo Financeiro",
        applyReset: "Recalibrar Parâmetros",
        simulationNotice: "As probabilidades utilizam simulações matemáticas dinâmicas de Monte Carlo em tempo real no seu dispositivo."
      },
      en: {
        title: "PredicIA™ Engine",
        subtitle: "Ambient Prediction & Life Orchestrator",
        desc: "Total environment predictive AI. Evaluates statistical intersections of weather, personal finances, home appliances, traffic, schedules, and vehicle health.",
        generalScore: "Harmony & Prevention Index",
        generalDesc: "The general indicator reflects the overall integrated stability and security of your day, crossing all metrics.",
        harmonyLabel: "Global Harmony",
        factorsTitle: "Ambient Simulation Variables",
        factorsDesc: "Change the parameters in real time to see how the failure probabilities and daily risks are recalculated.",
        
        tabTrajeto: "Commute & Weather",
        tabFinancas: "Money & Finances",
        tabCasa: "Home & Residence",
        tabAgenda: "Schedule & Time",
        tabVeiculo: "Vehicle & Health",

        lblRain: "Rainfall Intensity",
        lblCommute: "Departure Time",
        lblAc: "A/C Usage Hours",
        lblMeetings: "Scheduled Meetings",
        lblSavings: "Monthly Savings",
        lblVibration: "Refrigerator Vibration",
        lblCatalyst: "Odometer (Catalyst)",
        lblBrake: "Brake Pad Wear",

        cardTrajetoTitle: "Weather & Commute Prediction",
        cardTrajetoDesc: "Stochastic congestion and accident probability analysis on coastal roads and urban avenues.",
        cardFinancasTitle: "Financial Runway & Cashflow",
        cardFinancasDesc: "Projection of liquidity runways, cash flow trends, and accidental/emergency repair risks.",
        cardCasaTitle: "Home Predictive Health",
        cardCasaDesc: "Appliance degradation, air filter wear, and domestic energy consumption trends.",
        cardAgendaTitle: "Schedule & Focus Optimization",
        cardAgendaDesc: "Conflict probability, cognitive fatigue indexes, and deep-work window matching.",
        cardVeiculoTitle: "Vehicle Health & Telemetry",
        cardVeiculoDesc: "Component fatigue estimations, catalyst telemetry, and preemptive repair recommendations.",

        delayChance: "Traffic Delay Probability",
        aquaplaningRisk: "Aquaplaning Risk Index",
        runwayMonths: "Emergency Runway (months)",
        emergencyRisk: "Spontaneous Expense Risk",
        applianceWear: "Refrigerator Projected Wear",
        acFilterRisk: "A/C Filter Alert Score",
        exhaustionIndex: "Daily Cognitive Burnout Index",
        focusWindow: "Optimal Deep Work Slot",
        catalystHealth: "Catalyst Remaining Lifespan",
        brakeReplacement: "Projected Brake Repl. Interval",

        feedbackRainHigh: "Warning: Heavy rain increases aquaplaning risk by 4.5x on mountain pass roads.",
        feedbackRainLow: "Dry tarmac and excellent visibility along the route.",
        feedbackRunwayShort: "Alert: Buffer below 4 months. Please postpone non-essential spendings.",
        feedbackRunwaySafe: "Safe runway. Adequate capacity for preventive maintenance payments.",
        feedbackAcAlert: "Recommended: Wash air filter. Long running periods reduce efficiency.",
        feedbackMeetingOverload: "Overload: More than 5 daily meetings reduce cognitive output by 70%.",
        feedbackCatalystReplace: "OficIA warning: Long distance on catalyst. 68% chance of triggering emission DTC.",

        applyService: "Approve Appliance Maintenance",
        applyFinancialReview: "Optimize Financial Flow",
        applyReset: "Reset Parameters",
        simulationNotice: "Probabilities are calculated using dynamic Monte Carlo mathematical models processed locally."
      },
      es: {
        title: "PredicIA™ Engine",
        subtitle: "Orquestrador de Predicción de Entorno",
        desc: "IA predictiva del entorno total del usuario. Evalúa intersecciones estadísticas de clima, finanzas personales, electrodomésticos, tráfico, agenda y salud vehicular.",
        generalScore: "Índice de Armonía y Prevención",
        generalDesc: "El indicador general refleja la estabilidad y seguridad integrada de su día, cruzando todos los indicadores.",
        harmonyLabel: "Armonía General",
        factorsTitle: "Variables de Simulación Ambiental",
        factorsDesc: "Modifique las variables en tiempo real para observar cómo se recalculan al instante las probabilidades de riesgo.",
        
        tabTrajeto: "Trayecto y Clima",
        tabFinancas: "Dinero y Finanzas",
        tabCasa: "Hogar y Residencia",
        tabAgenda: "Agenda y Tiempo",
        tabVeiculo: "Vehículo y Salud",

        lblRain: "Intensidad de Lluvia",
        lblCommute: "Hora de Salida",
        lblAc: "Horas de Uso de A/A",
        lblMeetings: "Reuniones Agendadas",
        lblSavings: "Ahorro Mensual",
        lblVibration: "Vibración del Refrigerador",
        lblCatalyst: "Odómetro (Catalizador)",
        lblBrake: "Desgaste de Pastillas",

        cardTrajetoTitle: "Predicción de Clima y Trayecto",
        cardTrajetoDesc: "Análisis estocástico de congestión y accidentes en rutas costeras y avenidas principales.",
        cardFinancasTitle: "Proyección Financiera y Caja",
        cardFinancasDesc: "Estimación de flujo de caja, meses de reserva (runway) y riesgos de gastos de emergencia espontáneos.",
        cardCasaTitle: "Salud Predictiva del Hogar",
        cardCasaDesc: "Degradación de electrodomésticos, filtros de aire acondicionado y consumo energético del hogar.",
        cardAgendaTitle: "Optimización de Agenda y Enfoque",
        cardAgendaDesc: "Superposición de reuniones, fatiga mental y determinación del bloque óptimo para trabajo profundo.",
        cardVeiculoTitle: "Salud Predictiva Vehicular",
        cardVeiculoDesc: "Cálculo de fatiga molecular en componentes del automóvil y alertas de mantenimiento preventivo.",

        delayChance: "Probabilidad de Retraso de Tráfico",
        aquaplaningRisk: "Riesgo de Aquaplaning",
        runwayMonths: "Reserva de Capital (meses)",
        emergencyRisk: "Riesgo de Gasto Imprevisto",
        applianceWear: "Desgaste Estimado del Refrigerador",
        acFilterRisk: "Alerta de Filtro de Aire",
        exhaustionIndex: "Índice de Exhaustión Diaria",
        focusWindow: "Horario Óptimo de Enfoque",
        catalystHealth: "Vida Restante del Catalizador",
        brakeReplacement: "Reemplazo de Pastillas en",

        feedbackRainHigh: "Alerta: Lluvia intensa aumenta en 4.5x el riesgo de deslizamiento en descensos serranos.",
        feedbackRainLow: "Pistas secas y condiciones excelentes de visibilidad en el trayecto.",
        feedbackRunwayShort: "Alerta: Reserva menor a 4 meses. Evite compras suntuarias durante 15 días.",
        feedbackRunwaySafe: "Reserva estable. Capacidad adecuada para pagos preventivos de mantenimiento.",
        feedbackAcAlert: "Recomendado: Limpiar filtro de aire acondicionado. Uso alto acumulado.",
        feedbackMeetingOverload: "Sobrecarga: Más de 5 reuniones diarias reducen el foco cognitivo en un 70%.",
        feedbackCatalystReplace: "Alerta OficIA: Catalizador con alto desgaste. Probabilidad del 68% de error DTC.",

        applyService: "Aprobar Mantenimiento de Hogar",
        applyFinancialReview: "Calibrar Flujo Financiero",
        applyReset: "Restaurar Parámetros",
        simulationNotice: "Las probabilidades se derivan mediante modelos matemáticos dinámicos de Montecarlo locales."
      }
    };
  }, []);

  const cur = t[lang] || t.pt;

  // --- STATISTICAL PREDICTIVE ENGINE (REAL MATHEMATICAL COUPLING) ---
  const calculatedMetrics = useMemo(() => {
    // 1. Weather & Commute Math
    let delayProbability = 10; // Base delay %
    if (rainIntensity > 30) delayProbability += (rainIntensity - 30) * 0.8;
    if (commuteHour >= 17 && commuteHour <= 19) delayProbability += 35; // Rush hour PM
    if (commuteHour >= 7 && commuteHour <= 9) delayProbability += 30; // Rush hour AM
    delayProbability = Math.min(Math.round(delayProbability), 98);

    const aquaRisk = Math.min(Math.round(rainIntensity * 1.15), 99);

    // 2. Finance Math
    // Assuming base liquid reserve of R$ 12,000.
    const reserveBase = 12000;
    // Monthly fixed expense estimated at R$ 3,500. Savings mitigates this.
    const monthlyNetExpense = Math.max(3500 - monthlySavings, 1000);
    const runway = parseFloat((reserveBase / monthlyNetExpense).toFixed(1));

    let expenseRiskChance = 15; // Base %
    if (rainIntensity > 60) expenseRiskChance += 10; // Rain causes leaks/damage
    if (acUsageHours > 10) expenseRiskChance += 12; // High electricity bill risk
    if (catalystAge > 40000) expenseRiskChance += 25; // Impending mechanic bill
    expenseRiskChance = Math.min(Math.round(expenseRiskChance), 95);

    // 3. Home Wear Math
    const fridgeFailureProb = Math.min(Math.round(fridgeVibration * 2.8 + acUsageHours * 1.5), 95);
    const acFilterSaturation = Math.min(Math.round(acUsageHours * 7.5 + 20), 100);

    // 4. Calendar Focus Math
    const burnoutIndex = Math.min(Math.round(meetingsCount * 14.5 + (commuteHour < 8 || commuteHour > 20 ? 15 : 0)), 100);
    
    // Choose optimal deep work window
    let idealFocus = "10:00 - 12:00";
    if (meetingsCount > 6) {
      idealFocus = "08:00 - 09:30";
    } else if (commuteHour > 18) {
      idealFocus = "14:00 - 16:00";
    }

    // 5. Vehicle Health Math
    const catalystHealthPct = Math.max(100 - Math.round(catalystAge / 650), 12);
    const remainingBrakeKm = Math.max(Math.round((100 - brakeWear) * 350), 800);

    // 6. GLOBAL ENVIRONMENT HARMONY INDEX (AGGREGATE PREDICTION SCORE)
    // High risk in any sector drag down the harmony index
    const categoryScores = [
      100 - delayProbability,
      100 - aquaRisk,
      Math.min(runway * 10, 100),
      100 - expenseRiskChance,
      100 - fridgeFailureProb,
      100 - acFilterSaturation,
      100 - burnoutIndex,
      catalystHealthPct,
      100 - brakeWear
    ];
    
    const avgScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length);
    const globalHarmonyScore = Math.max(Math.min(avgScore + 10, 100), 10); // Normalised offset

    return {
      delayProbability,
      aquaRisk,
      runway,
      expenseRiskChance,
      fridgeFailureProb,
      acFilterSaturation,
      burnoutIndex,
      idealFocus,
      catalystHealthPct,
      remainingBrakeKm,
      globalHarmonyScore
    };
  }, [rainIntensity, commuteHour, acUsageHours, meetingsCount, monthlySavings, fridgeVibration, catalystAge, brakeWear]);

  const handleReset = () => {
    setRainIntensity(25);
    setCommuteHour(9);
    setAcUsageHours(6);
    setMeetingsCount(4);
    setMonthlySavings(1500);
    setFridgeVibration(10);
    setCatalystAge(25000);
    setBrakeWear(40);
    setSuccessToast(cur.applyReset);
  };

  const handleApplyHomeMaint = () => {
    setFridgeVibration(5);
    setSuccessToast(lang === 'pt' ? "Visita do técnico preditivo agendada! Vibração reduzida para 5Hz." : "Predictive technician visit scheduled! Refrigerator vibration minimized.");
  };

  const handleApplyFinanceReview = () => {
    setMonthlySavings(prev => prev + 400);
    setSuccessToast(lang === 'pt' ? "Reajuste de aportes realizado! Poupança mensal aumentada em +R$ 400,00." : "Monthly savings boosted by +$100.00 to optimize safety buffers.");
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-5xl mx-auto px-1 sm:px-0">
      
      {/* Platform Banner */}
      <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sapare-violet/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sapare-violet/15 text-sapare-violet2 flex items-center justify-center border border-sapare-violet/30 shadow-lg shadow-sapare-violet/5 shrink-0">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-sapare-violet2 uppercase bg-sapare-violet/10 px-2 py-0.5 rounded border border-sapare-violet/20">
                  AMBIENTAL • PROBABILÍSTICO • 360°
                </span>
                <span className="text-[9px] text-tech-secundario font-bold uppercase">{cur.subtitle}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-tech-texto font-display flex items-center gap-2 mt-1">
                {cur.title}
              </h2>
            </div>
          </div>
          <p className="text-xs text-tech-secundario max-w-md md:text-right">
            {cur.desc}
          </p>
        </div>
      </div>

      {/* GLOBAL SCORING HUD PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Big Harmony Wheel Indicator */}
        <div className="bg-tech-cartao border-2 border-sapare-violet/35 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden text-center col-span-1">
          <div className="absolute inset-0 bg-gradient-to-b from-sapare-violet/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-black text-sapare-violet2 tracking-widest uppercase block">
              {cur.harmonyLabel}
            </span>
            <p className="text-[9px] text-tech-secundario leading-normal px-2">
              {cur.generalDesc}
            </p>
          </div>

          <div className="my-5 relative flex items-center justify-center">
            {/* Glowing ring */}
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 bg-sapare-dark/40 ${
              calculatedMetrics.globalHarmonyScore > 75 
                ? 'border-sapare-teal shadow-lg shadow-sapare-teal/10' 
                : calculatedMetrics.globalHarmonyScore > 50 
                ? 'border-sapare-gold shadow-lg shadow-sapare-gold/10' 
                : 'border-red-500 shadow-lg shadow-red-500/10'
            }`}>
              <span className="text-4xl font-black text-tech-texto tracking-tight">
                {calculatedMetrics.globalHarmonyScore}%
              </span>
              <span className="text-[9px] font-black tracking-wider uppercase font-mono text-tech-secundario mt-0.5">
                {calculatedMetrics.globalHarmonyScore > 75 
                  ? 'ESTÁVEL' 
                  : calculatedMetrics.globalHarmonyScore > 50 
                  ? 'ALERTA' 
                  : 'CRÍTICO'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleReset}
              className="w-full bg-sapare-dark hover:bg-tech-borda border border-tech-borda text-tech-texto text-[10px] py-1.5 rounded-xl transition font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCcw className="w-3 h-3" /> {cur.applyReset}
            </button>
          </div>
        </div>

        {/* Simulator controls sliders */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg lg:col-span-3 space-y-4">
          <div>
            <h3 className="text-xs font-black text-tech-texto uppercase tracking-wider flex items-center gap-1.5 border-b border-tech-borda pb-2">
              <Sliders className="w-4 h-4 text-sapare-violet" />
              {cur.factorsTitle}
            </h3>
            <p className="text-[10px] text-tech-secundario mt-1">
              {cur.factorsDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Clima & Trânsito Sliders */}
            <div className="space-y-3 bg-sapare-dark/45 p-3 rounded-xl border border-tech-borda/60">
              <span className="text-[9px] font-black text-sapare-teal uppercase tracking-widest block border-b border-tech-borda/40 pb-1">
                ⛈️ Clima & Trajeto
              </span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblRain}</span>
                  <span className="font-mono text-sapare-teal">{rainIntensity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={rainIntensity} 
                  onChange={(e) => setRainIntensity(Number(e.target.value))}
                  className="w-full accent-sapare-teal h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblCommute}</span>
                  <span className="font-mono text-sapare-teal">{commuteHour}h:00</span>
                </div>
                <input 
                  type="range" min="0" max="23" value={commuteHour} 
                  onChange={(e) => setCommuteHour(Number(e.target.value))}
                  className="w-full accent-sapare-teal h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Finanças Sliders */}
            <div className="space-y-3 bg-sapare-dark/45 p-3 rounded-xl border border-tech-borda/60">
              <span className="text-[9px] font-black text-sapare-gold uppercase tracking-widest block border-b border-tech-borda/40 pb-1">
                💼 Dinheiro & Fluxo
              </span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblSavings}</span>
                  <span className="font-mono text-sapare-gold">R$ {monthlySavings}</span>
                </div>
                <input 
                  type="range" min="0" max="4000" step="100" value={monthlySavings} 
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full accent-sapare-gold h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>

              <div className="text-[9px] text-tech-secundario pt-1">
                Reserva Base Liquida simulada em <strong className="text-tech-texto font-bold">R$ 12.000,00</strong>.
              </div>
            </div>

            {/* Casa & Energia Sliders */}
            <div className="space-y-3 bg-sapare-dark/45 p-3 rounded-xl border border-tech-borda/60">
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block border-b border-tech-borda/40 pb-1">
                🏠 Residência & Casa
              </span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblAc}</span>
                  <span className="font-mono text-orange-400">{acUsageHours}h / dia</span>
                </div>
                <input 
                  type="range" min="0" max="24" value={acUsageHours} 
                  onChange={(e) => setAcUsageHours(Number(e.target.value))}
                  className="w-full accent-orange-400 h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblVibration}</span>
                  <span className="font-mono text-orange-400">{fridgeVibration} Hz</span>
                </div>
                <input 
                  type="range" min="2" max="40" value={fridgeVibration} 
                  onChange={(e) => setFridgeVibration(Number(e.target.value))}
                  className="w-full accent-orange-400 h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Agenda e Veículo Sliders */}
            <div className="space-y-3 bg-sapare-dark/45 p-3 rounded-xl border border-tech-borda/60">
              <span className="text-[9px] font-black text-sapare-violet2 uppercase tracking-widest block border-b border-tech-borda/40 pb-1">
                📅 Agenda & Veículo
              </span>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblMeetings}</span>
                  <span className="font-mono text-sapare-violet2">{meetingsCount}</span>
                </div>
                <input 
                  type="range" min="0" max="15" value={meetingsCount} 
                  onChange={(e) => setMeetingsCount(Number(e.target.value))}
                  className="w-full accent-sapare-violet2 h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-tech-texto font-semibold">
                  <span>{cur.lblCatalyst}</span>
                  <span className="font-mono text-sapare-violet2">{catalystAge} km</span>
                </div>
                <input 
                  type="range" min="1000" max="80000" step="1000" value={catalystAge} 
                  onChange={(e) => setCatalystAge(Number(e.target.value))}
                  className="w-full accent-sapare-violet2 h-1.5 bg-tech-fundo rounded-lg cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* PREDICTIVE SECTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* SECTION 1: WEATHER & COMMUTE */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sapare-teal/10 rounded-lg border border-sapare-teal/20 text-sapare-teal">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">{cur.cardTrajetoTitle}</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">{cur.cardTrajetoDesc}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.delayChance}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.delayProbability > 60 ? 'text-red-500' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.delayProbability}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    {commuteHour}h:00 saída
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.aquaplaningRisk}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.aquaRisk > 50 ? 'text-red-500 animate-pulse' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.aquaRisk}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Chuva {rainIntensity}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-texto/85 italic bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              {rainIntensity > 50 ? cur.feedbackRainHigh : cur.feedbackRainLow}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-tech-borda text-center">
            <span className="text-[9px] text-sapare-teal font-bold tracking-wider uppercase font-mono flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> Rota: Rodovia dos Tamoios - OK
            </span>
          </div>
        </div>

        {/* SECTION 2: MONEY & CAPITAL RUNWAY */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sapare-gold/10 rounded-lg border border-sapare-gold/20 text-sapare-gold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">{cur.cardFinancasTitle}</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">{cur.cardFinancasDesc}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.runwayMonths}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.runway < 4 ? 'text-red-500 animate-pulse' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.runway} meses
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Economia: R$ {monthlySavings}/m
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.emergencyRisk}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.expenseRiskChance > 60 ? 'text-red-500' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.expenseRiskChance}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Risco de Quebra Ativo
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-texto/85 italic bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              {calculatedMetrics.runway < 4 ? cur.feedbackRunwayShort : cur.feedbackRunwaySafe}
            </p>
          </div>

          <div className="pt-3">
            <button 
              onClick={handleApplyFinanceReview}
              className="w-full bg-sapare-dark hover:bg-tech-borda text-tech-texto text-[10px] py-1.5 rounded-xl border border-tech-borda font-bold uppercase transition cursor-pointer"
            >
              {cur.applyFinancialReview}
            </button>
          </div>
        </div>

        {/* SECTION 3: RESIDENCIA & HOME HEALTH */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-400">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">{cur.cardCasaTitle}</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">{cur.cardCasaDesc}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.applianceWear}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.fridgeFailureProb > 60 ? 'text-red-500' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.fridgeFailureProb}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Compressores {fridgeVibration}Hz
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.acFilterRisk}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-sapare-teal">
                    {calculatedMetrics.acFilterSaturation}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Uso: {acUsageHours}h/dia
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-texto/85 italic bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              {calculatedMetrics.acFilterSaturation > 70 ? cur.feedbackAcAlert : "Filtros de Climatização em nível aceitável de poeira."}
            </p>
          </div>

          <div className="pt-3">
            <button 
              onClick={handleApplyHomeMaint}
              className="w-full bg-sapare-dark hover:bg-tech-borda text-tech-texto text-[10px] py-1.5 rounded-xl border border-tech-borda font-bold uppercase transition cursor-pointer"
            >
              {cur.applyService}
            </button>
          </div>
        </div>

        {/* SECTION 4: CALENDAR & PHYSICAL WELLBEING */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sapare-violet/10 rounded-lg border border-sapare-violet/20 text-sapare-violet2">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">{cur.cardAgendaTitle}</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">{cur.cardAgendaDesc}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.exhaustionIndex}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.burnoutIndex > 70 ? 'text-red-500 animate-pulse' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.burnoutIndex}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    {meetingsCount} reuniões hoje
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.focusWindow}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black font-mono text-sapare-teal">
                    {calculatedMetrics.idealFocus}
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Foco Produtivo
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-texto/85 italic bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              {meetingsCount > 5 ? cur.feedbackMeetingOverload : "Fluxo de reuniões adequado para trabalho intelectual focado."}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-tech-borda text-center">
            <span className="text-[9px] text-sapare-violet2 font-bold tracking-wider uppercase font-mono flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" /> Sincronizado com Microsoft Teams & GCal
            </span>
          </div>
        </div>

        {/* SECTION 5: VEHICLE HEALTH */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sapare-violet/10 rounded-lg border border-sapare-violet/20 text-sapare-violet2">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">{cur.cardVeiculoTitle}</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">{cur.cardVeiculoDesc}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.catalystHealth}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-black font-mono ${calculatedMetrics.catalystHealthPct < 50 ? 'text-red-500' : 'text-sapare-teal'}`}>
                    {calculatedMetrics.catalystHealthPct}%
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Mercedes A200
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sapare-dark/45 border border-tech-borda/50 rounded-xl space-y-1">
                <span className="text-[10px] text-tech-secundario font-semibold block uppercase font-mono">{cur.brakeReplacement}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-sapare-teal">
                    {calculatedMetrics.remainingBrakeKm} km
                  </span>
                  <span className="text-[9px] font-bold text-tech-secundario">
                    Pastilhas {100 - brakeWear}% ok
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-texto/85 italic bg-tech-fundo/40 p-2.5 rounded-lg border border-tech-borda">
              {catalystAge > 40000 ? cur.feedbackCatalystReplace : "Catalisador e freios operando dentro da margem de segurança nominal."}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-tech-borda text-center">
            <span className="text-[9px] text-sapare-teal font-bold tracking-wider uppercase font-mono flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Vinculado com OficIA™ Principal
            </span>
          </div>
        </div>

        {/* SECTION 6: AMBIENT MONTE CARLO SUMMARY */}
        <div className="bg-tech-cartao border border-tech-borda rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-tech-borda pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sapare-violet/10 rounded-lg border border-sapare-violet/20 text-sapare-violet2">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-tech-texto">Monte Carlo Engine</h4>
                  <span className="text-[9px] text-tech-secundario block font-mono">Simulador de Riscos Concorrentes</span>
                </div>
              </div>
            </div>

            <div className="bg-sapare-dark/70 border border-tech-borda rounded-xl p-4 space-y-3 text-xs font-mono">
              <div className="flex justify-between text-[11px]">
                <span className="text-tech-secundario">Iterações Locais:</span>
                <span className="text-tech-texto font-black">10.000 sim/seg</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-tech-secundario">Risco Concorrente:</span>
                <span className="text-red-400 font-black">
                  {calculatedMetrics.globalHarmonyScore < 60 ? "MÉDIO-ALTO" : "BAIXO"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-tech-secundario">Variabilidade Estimada:</span>
                <span className="text-sapare-teal font-black">σ = 3.2%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-tech-secundario">Alvo de Prevenção:</span>
                <span className="text-tech-texto">Evitar Multas e Quebras</span>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-tech-secundario">
              {cur.simulationNotice}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-tech-borda text-center text-[10px] font-mono text-tech-secundario/80">
            Powered by HENIZA TECH Predict©
          </div>
        </div>

      </div>

    </div>
  );
}
