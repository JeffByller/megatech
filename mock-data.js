// Ampliação única da demonstração. Preserva os registros existentes e suas edições.
function buildMockData() {
  const names = ['Lucas Almeida','Beatriz Souza','Rafael Lima','Juliana Rocha','Pedro Martins','Camila Ferreira','Bruno Carvalho','Larissa Gomes','Diego Ribeiro','Fernanda Alves','Gabriel Barbosa','Patrícia Melo','Thiago Nunes','Renata Castro','André Moreira','Daniela Azevedo','Felipe Correia','Aline Batista','Rodrigo Freitas','Vanessa Moura','Eduardo Teixeira','Priscila Ramos','Henrique Dias','Tatiane Lopes','Marcelo Vieira','Luciana Pinto','Vinícius Cardoso','Sandra Monteiro','Gustavo Mendes','Cláudia Araújo'];
  const cities = ['Recife','Olinda','Jaboatão dos Guararapes','Paulista','Camaragibe'];
  const districts = ['Centro','Boa Vista','Casa Amarela','Madalena','Várzea','Espinheiro'];
  const materialNames = ['Câmera IP externa','Câmera dome interna','Câmera bullet Full HD','DVR 8 canais','NVR 16 canais','HD vigilância 1 TB','HD vigilância 2 TB','Cabo de rede CAT6','Cabo coaxial','Conector RJ45 CAT6','Conector BNC','Fonte 12V 5A','Fonte 12V 10A','Switch 8 portas','Switch PoE 8 portas','Roteador dual band','Access point Wi-Fi 6','Rack de parede 6U','Patch panel 24 portas','Patch cord 1 metro','Canaleta 20x10','Eletroduto PVC','Caixa de passagem','Suporte para câmera','Nobreak 1200 VA','Bateria 12V 7Ah','Kit parafusos e buchas','Organizador de cabos','Tomada de rede','Injetor PoE'];
  const serviceNames = ['Instalação de câmera IP externa','Instalação de câmera dome','Configuração de DVR','Configuração de NVR','Troca de HD de vigilância','Atualização de firmware','Passagem de cabo de rede','Crimpagem de conectores','Certificação de ponto de rede','Instalação de switch PoE','Configuração de roteador','Instalação de access point','Montagem de rack','Organização de rack','Instalação de patch panel','Diagnóstico de rede','Manutenção preventiva de CFTV','Limpeza de câmeras','Ajuste de foco e enquadramento','Configuração de acesso remoto','Instalação de nobreak','Troca de bateria','Instalação de canaleta','Instalação de eletroduto','Configuração de rede Wi-Fi','Ampliação de cobertura Wi-Fi','Configuração de VLAN','Migração de equipamentos','Visita técnica','Treinamento do usuário'];
  const clients = names.map((name,i)=>({name,phone:`(81) 90000-${String(2000+i).padStart(4,'0')}`,whatsapp:`(81) 90000-${2000+i}`,email:`cliente${i+1}@example.com`,street:`Rua de Demonstração ${i+1}`,number:String(20+i*7),district:districts[i%6],city:cities[i%5],zip:`50000-${String(i+1).padStart(3,'0')}`,state:'PE',demoKey:`volume-client-${i}`}));
  const materials = materialNames.map((name,i)=>({name,sku:`MAT-${String(i+1).padStart(3,'0')}`,unit:[7,8,20,21].includes(i)?'m':'un',stock:i%7===0?0:i%5===0?3:10+i*4,price:Number((12.5+i*17.9).toFixed(2)),demoKey:`volume-material-${i}`}));
  const services = serviceNames.map((name,i)=>({name,unit:[6,22,23].includes(i)?'m':'serviço',price:80+i*15,demoKey:`volume-service-${i}`}));
  return { clients, materials, services };
}
function expandDemoData() {
  const marker = 'megatech-volume-demo-v1';
  try { if(localStorage.getItem(marker)) return; } catch { return; }
  const samples = buildMockData();
  for (const type of ['clients','materials','services']) {
    const needed = Math.max(0,30-catalogs[type].length);
    const candidates = samples[type].filter(sample=>!catalogs[type].some(row=>row.demoKey===sample.demoKey));
    const nextId = Math.max(0,...catalogs[type].map(row=>row.id))+1;
    const next = [...catalogs[type],...candidates.slice(0,needed).map((sample,i)=>({...sample,id:nextId+i}))];
    if (!writeCatalog(type,next)) return;
  }
  const nextOrders = [...orders], needed = Math.max(0,30-orders.length);
  const nextId = Math.max(1000,...orders.map(row=>row.id))+1;
  const clients = catalogs.clients.filter(row=>row.demoKey);
  const materials = catalogs.materials.filter(row=>row.demoKey);
  const services = catalogs.services.filter(row=>row.demoKey);
  const stages = ['Concluído','Orçamento','Aprovado','Em execução'];
  for(let i=0;i<needed;i++) {
    const client=clients[i%clients.length] || catalogs.clients[i%catalogs.clients.length];
    const material=materials[i%materials.length] || catalogs.materials[i%catalogs.materials.length];
    const service=services[i%services.length] || catalogs.services[i%catalogs.services.length];
    // 2025-01 a 2027-12, com dias válidos inclusive em fevereiro.
    const month=Math.round(i*35/Math.max(1,needed-1));
    nextOrders.push({...client,id:nextId+i,clientId:client.id,demoKey:`volume-order-${i}`,date:`${2025+Math.floor(month/12)}-${String(month%12+1).padStart(2,'0')}-${String(i%27+1).padStart(2,'0')}`,status:stages[i%4],title:service.name,items:[{catalogId:material.id,type:'material',desc:`${material.name} (${material.unit})`,qty:1+i%5,price:material.price},{catalogId:service.id,type:'service',desc:service.name,qty:1,price:service.price}]});
  }
  const previous = orders; orders = nextOrders;
  if(!persist()){orders=previous;return;}
  try {localStorage.setItem(marker,'1');} catch {}
}
expandDemoData();
home();
