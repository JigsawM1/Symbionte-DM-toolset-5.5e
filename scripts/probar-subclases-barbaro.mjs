import assert from "node:assert/strict";

export async function probarSubclasesBarbaro({pagina,informe,toggle,pulsar,click,cerrarModal,tiradas}) {
  const esperar = condicion => pagina.waitForFunction(condicion);
  const ir = async vista => { await pagina.evaluate(v=>window.ir(v),vista); };
  const comprobarDialogo = async () => {
    assert(await pagina.$eval('dialog[open]', d => {
      const caja = d.getBoundingClientRect();
      const pie = d.querySelector('footer').getBoundingClientRect();
      const cuerpo = d.querySelector('.u-scroll-cef');
      return d.scrollWidth <= d.clientWidth + 1 && caja.top >= 0 && caja.bottom <= innerHeight
        && pie.top >= caja.top && pie.bottom <= caja.bottom && getComputedStyle(cuerpo).backgroundColor === 'rgb(11, 15, 22)';
    }), 'El diálogo debe caber y conservar las acciones visibles, con scroll opaco en el cuerpo');
  };
  const sembrar = async subclase => {
    await pagina.evaluate(s=>window.sembrar(14,s),subclase);
    await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
  };
  const danoDesarmado = async () => {
    await ir('ataques'); await pagina.waitForSelector('button[title^="Tirar Ataque con"]');
    const h=await pagina.evaluateHandle(()=>[...document.querySelectorAll('button[title^="Tirar Ataque con"]')]
      .find(b=>/sin armas|desarmado/i.test(b.title))?.closest('[class*="tarjetaAtaqueCompacta"]')?.querySelector('button[title^="Tirar Daño"]'));
    assert(h.asElement()); await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const elegirFuria = async (animal,poder) => {
    await toggle('Furia');
    await click(`dialog[open] button[aria-label="Seleccionar ${animal}"]`);
    await click(`dialog[open] button[aria-label="Seleccionar ${poder}"]`);
    await click('dialog[open] button[aria-label="Confirmar activación"]');
    await esperar(()=>window.rasgo('Furia').activo);
  };
  for(const width of [599,433]) for(const height of [760,600]) {
    await pagina.setViewport({width,height});
    await sembrar('Senda del Berserker');
    await pagina.evaluate(()=>{window.estado().aplicarCondicionPersonaje(window.pj().id,'Asustado');window.estado().aplicarCondicionPersonaje(window.pj().id,'Hechizado');});
    await toggle('Furia');
    assert.equal(await pagina.evaluate(()=>window.pj().condicionesActivas.some(c=>/Asustado|Hechizado/.test(c))),false);
    await toggle('Ataque temerario'); await toggle('Frenesí');
    let desde=tiradas.length; await danoDesarmado();
    await esperar(()=>!window.rasgo('Frenesí').activo);
    assert(tiradas.slice(desde).some(t=>t.includes('3d6')));
    await ir('rasgos'); await toggle('Furia');
    await pulsar('Presencia intimidante','button[title="Gastar 1 uso"]');
    await pulsar('Presencia intimidante','button[title="Recargar uso gastando 1 uso de Furia"]');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Presencia intimidante').usosRestantes),1);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),3);
    const presencia=await pagina.evaluateHandle(()=>[...document.querySelectorAll('article')].find(a=>a.querySelector('[class*="nombreRasgo"]')?.textContent.includes('Presencia intimidante')));
    assert(!await presencia.evaluate(e=>e.textContent.includes('Aplicación al objetivo manual')));
    assert.match(await presencia.evaluate(e=>e.textContent),/CD \d+ · SAB/);
    await presencia.asElement().scrollIntoView();
    await presencia.asElement().screenshot({path:`scratch/barbaro-presencia-${width}x${height}.png`});await presencia.dispose();
    informe.dimensiones.push({vista:'berserker',width,height});

    await sembrar('Senda del Corazón Salvaje');
    assert.equal(await pagina.$('article section[aria-label="Rituales concedidos por rasgos"]'),null);
    const grupoRituales=await pagina.waitForSelector('[data-seccion-rasgos="subclase"]');
    await grupoRituales.scrollIntoView();
    await grupoRituales.screenshot({path:`scratch/barbaro-rasgos-rituales-${width}x${height}.png`});
    await ir('caracteristicas');
    const magia=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
    await magia.asElement().scrollIntoView();await magia.asElement().click();await magia.dispose();
    await pagina.waitForFunction(()=>/hablar con los animales/i.test(document.body.textContent));
    assert.equal(await pagina.$('section[aria-label="Rituales concedidos por rasgos"]'),null);
    await pagina.screenshot({path:`scratch/barbaro-magia-rituales-${width}x${height}.png`});
    await ir('rasgos');
    await toggle('Furia');
    assert(await pagina.$eval('dialog[open] button[aria-label="Confirmar activación"]',b=>b.disabled));
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.$('dialog[open]'),null);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),5);
    await toggle('Furia'); await click('dialog[open] button[aria-label="Seleccionar Oso"]');
    assert.equal(await pagina.$eval('dialog[open] button[aria-label="Seleccionar Oso"]',b=>getComputedStyle(b).textTransform),'none');
    await comprobarDialogo();
    await pagina.screenshot({path:`scratch/barbaro-dialogo-furia-${width}x${height}.png`});
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),5);
    const cancelar=await pagina.evaluateHandle(()=>[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent==='Cancelar'));
    await cancelar.asElement().click();await cancelar.dispose();
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').activo),false);
    await elegirFuria('Oso','Halcón');
    assert.equal(await pagina.evaluate(()=>window.velocidades().volar===window.velocidades().caminar),true);
    assert.match(await pagina.$eval('section[aria-label="Resistencias e inmunidades"]',e=>e.textContent),/Fuego/);
    await pagina.screenshot({path:`scratch/barbaro-corazon-${width}x${height}.png`});
    await toggle('Furia');
    await pulsar('Aspecto de las tierras salvajes','button[title="Ver descripción completa en modal"]');
    const elegirAspecto=async nombre=>{
      const h=await pagina.waitForFunction(n=>[...document.querySelectorAll('button[class*="opcionSelectorCard"]')].find(b=>b.textContent.trim()===n),{},nombre);
      await h.asElement().scrollIntoView();await h.asElement().click();await h.dispose();
    };
    await elegirAspecto('Búho');await cerrarModal();
    assert.equal(await pagina.evaluate(()=>window.sentidos().visionOscuridad),60);
    await pagina.evaluate(()=>window.descansar());
    await pulsar('Aspecto de las tierras salvajes','button[title="Ver descripción completa en modal"]');
    await elegirAspecto('Salmón');await cerrarModal();
    assert.equal(await pagina.evaluate(()=>window.velocidades().nadar===window.velocidades().caminar),true);
    await pulsar('Hablante de los animales','button[title="Ver descripción completa en modal"]');
    await click('button[title="Lanzar ritual: Sentidos de la bestia"]');
    await esperar(()=>window.pj().efectosActivos.some(e=>e.concentracion));
    await cerrarModal();
    await elegirFuria('Águila','Carnero');
    assert.equal(await pagina.evaluate(()=>window.pj().efectosActivos.some(e=>e.concentracion)),false);
    await pulsar('Hablante de los animales','button[title="Ver descripción completa en modal"]');
    assert(await pagina.$eval('section[aria-label="Rituales concedidos por rasgos"] button',b=>b.disabled));
    await cerrarModal();
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').selectores.find(s=>s.id==='furia_tierras_salvajes_opcion').valorActual[0]),'aguila');
    informe.dimensiones.push({vista:'corazon-salvaje',width,height});

    await sembrar('Senda del Árbol del Mundo'); await toggle('Furia');
    assert.equal(await pagina.evaluate(()=>window.pj().hpTemporal),14);
    await pulsar('Vitalidad del Árbol','button[title^="Lanzar 3d6"]');
    assert.equal(await pagina.evaluate(()=>window.pj().hpTemporal),14);
    await pulsar('Viaje por el Árbol: viaje lejano','button[title="Gastar 1 uso"]');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Viaje por el Árbol: viaje lejano').usosRestantes),0);
    await toggle('Furia');await toggle('Furia');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Viaje por el Árbol: viaje lejano').usosRestantes),1);
    informe.dimensiones.push({vista:'arbol-del-mundo',width,height});

    await sembrar('Senda del Fanático');
    await pagina.evaluate(()=>window.estado().actualizarPersonaje(window.pj().id,{hpMaximoBase:100,hpMaximo:100,hpActual:1}));
    await click('button[aria-label="Elegir cuántos dados de curación gastar"]');
    await comprobarDialogo();
    assert(await pagina.$eval('button[aria-label="Gastar un dado menos"]',b=>b.disabled));
    await click('button[aria-label="Gastar un dado más"]');
    assert.equal(await pagina.$eval('input[aria-label="Dados de curación"]',e=>e.value),'2');
    await click('button[aria-label="Gastar un dado menos"]');
    await click('button[aria-label="Cerrar curación"]');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Guerrero de los dioses').usosRestantes),6);
    await click('button[aria-label="Elegir cuántos dados de curación gastar"]');
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.$('dialog[open]'),null);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Guerrero de los dioses').usosRestantes),6);
    await click('button[aria-label="Elegir cuántos dados de curación gastar"]');
    const campo=await pagina.waitForSelector('dialog[open] input[aria-label="Dados de curación"]');
    assert.equal(await campo.evaluate(e=>e.value),'1');
    await campo.focus();await pagina.keyboard.down('Control');await pagina.keyboard.press('KeyA');await pagina.keyboard.up('Control');
    await campo.press('Backspace');await campo.type('2');
    assert.equal(await campo.evaluate(e=>e.value),'2');await campo.press('Tab');
    assert.equal(await campo.evaluate(e=>e.value),'2');
    await pagina.screenshot({path:`scratch/barbaro-curacion-d12-${width}x${height}.png`});
    await click('dialog[open] button[type="submit"]');
    await esperar(()=>window.rasgo('Guerrero de los dioses').usosRestantes===4 && window.pj().hpActual>1);
    await toggle('Furia');
    await comprobarDialogo();
    assert.match(await pagina.$eval('dialog[open]',e=>e.textContent),/1 uso/);
    await click('dialog[open] input[type="checkbox"]');
    await pagina.screenshot({path:`scratch/barbaro-furia-opcional-${width}x${height}.png`});
    const cancelarOpcional=await pagina.evaluateHandle(()=>[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent==='Cancelar'));
    await cancelarOpcional.asElement().click();await cancelarOpcional.dispose();
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia de los dioses').usosRestantes),1);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),5);
    await toggle('Furia');
    assert.equal(await pagina.$eval('dialog[open] input[type="checkbox"]',e=>e.checked),false);
    await click('dialog[open] input[type="checkbox"]');
    await click('dialog[open] button[aria-label="Confirmar activación"]');
    await esperar(()=>window.rasgo('Furia de los dioses').activo);
    await toggle('Furia divina');await click('dialog[open] button[aria-label="Seleccionar Necrótico"]');await click('dialog[open] button[aria-label="Confirmar activación"]');
    desde=tiradas.length;await danoDesarmado();await esperar(()=>!window.rasgo('Furia divina').activo);
    assert(tiradas.slice(desde).some(t=>t.includes('1d6+7') && /necr[oó]tico/i.test(t)), tiradas.slice(desde).join('\n'));
    await ir('rasgos');await toggle('Enfoque fanático');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Enfoque fanático').usosRestantes),1);
    await ir('caracteristicas');
    const combate=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>/Combate y atributos/i.test(b.textContent)));
    await combate.asElement().scrollIntoView(); await combate.asElement().click(); await combate.dispose();
    const salvacion=await pagina.waitForSelector('button[title^="Tirada de Salvación de FUE"]');await salvacion.scrollIntoView();await salvacion.click();
    await esperar(()=>!window.rasgo('Enfoque fanático').activo && window.rasgo('Enfoque fanático').usosRestantes===0);
    await ir('rasgos'); await toggle('Furia');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia de los dioses').activo),true);
    await pagina.screenshot({path:`scratch/barbaro-fanatico-${width}x${height}.png`});
    await pagina.evaluate(()=>window.estado().actualizarPersonaje(window.pj().id,{hpActual:0}));
    await esperar(()=>!window.rasgo('Furia de los dioses').activo);
    assert.equal(await pagina.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    informe.dimensiones.push({vista:'fanatico',width,height});
  }
  informe.casos.push('Berserker: inmunidad, Frenesí y recarga fuera de Furia','Corazón Salvaje: diálogo cancelable, elecciones, descanso y ritual con concentración',
    'Árbol del Mundo: PG temporales al entrar, tirada dirigida y reserva por Furia','Fanático: curación variable d12, daño elegido, Enfoque y forma opcional independiente',
    'UI: rituales sin bloques duplicados, CD compacta y detalles accesibles',
    'Diálogos: Escape y cancelación sin gasto, opciones sin preselección, contador de dados y pie visible sin desbordamiento');
}
