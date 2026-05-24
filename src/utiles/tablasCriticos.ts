/**
 * Base de Datos estática de Tablas de Pifias y Críticos para D&D 5.5e (2024).
 * Extraído directamente del archivo del usuario: "tabla criticos.md".
 *
 * Programado 100% en español.
 */

export interface EfectoCritico {
  numero: number;
  resultado: string;
}

export interface TablaSeveridad {
  criticos: EfectoCritico[];
  pifias: EfectoCritico[];
  superCriticos: EfectoCritico[];
  superPifias: EfectoCritico[];
}

export const TABLAS_CRITICOS_55E: Record<"magico" | "melee" | "distancia", TablaSeveridad> = {
  magico: {
    criticos: [
      { numero: 1, resultado: "Retroceso mágico – El hechizo te impacta parcialmente a ti también: sufres la mitad del daño (si aplica) o una condición leve (desventaja en la próxima tirada de ataque mágica)." },
      { numero: 2, resultado: "Exceso de canalización – Tu magia explota en chispas que ciegan: tú y tu objetivo quedan cegados hasta el inicio de tu próximo turno." },
      { numero: 3, resultado: "Rebote errático – El hechizo rebota a una criatura aliada cercana (5 pies del objetivo): tira un dado de daño normal." },
      { numero: 4, resultado: "Pico de resonancia – El área del hechizo vibra intensamente: las criaturas en 5 pies del objetivo hacen salvación de Constitución o quedan aturdidas 1 ronda." },
      { numero: 5, resultado: "Efecto secundario inofensivo – Tu hechizo deja un rastro de humo, fuego fatuo o sonido cómico. Sin efecto mecánico." },
      { numero: 6, resultado: "Conjuro prolongado – Tu hechizo dura 1 ronda adicional si tiene duración." },
      { numero: 7, resultado: "Golpe resonante – El objetivo tiene desventaja en su próxima tirada de salvación contra hechizos hasta el final de tu siguiente turno." },
      { numero: 8, resultado: "Aceleración elemental – Si el hechizo hace daño elemental, el objetivo queda vulnerable a ese daño hasta el final de tu próximo turno." },
      { numero: 9, resultado: "Canalización armónica – Puedes mover el hechizo 5 pies sin usar acción si es continuo (como flame blade, espada mental, etc.)." },
      { numero: 10, resultado: "Desbordamiento místico – Ganas 2d6 puntos de golpe temporales al lanzar este hechizo." },
      { numero: 11, resultado: "Distorsión arcana – El objetivo queda silenciado hasta el final de su siguiente turno. (Salvación de Carisma CD 13 para evitarlo)" },
      { numero: 12, resultado: "Conjuro doble eco – El daño del hechizo ignora resistencia al tipo de daño." },
      { numero: 13, resultado: "Fulgor inesperado – Todas las criaturas aliadas a 10 pies ganan +1d4 a su próxima tirada de ataque." },
      { numero: 14, resultado: "Conexión pura – El objetivo tiene desventaja en su próxima tirada de ataque." },
      { numero: 15, resultado: "Control absoluto – Si el hechizo requiere concentración, ganas ventaja en las tiradas para mantenerla durante 1 minuto." },
      { numero: 16, resultado: "Vórtice de poder – Puedes lanzar un truco como acción adicional este turno." },
      { numero: 17, resultado: "Canalización explosiva – El daño del hechizo aumenta un dado adicional (como si escalaras el conjuro)." },
      { numero: 18, resultado: "Impacto devastador – El objetivo pierde su reacción hasta el inicio de su próximo turno." },
      { numero: 19, resultado: "Desgarramiento mágico – El objetivo debe hacer una tirada de salvación del mismo tipo que el hechizo o quedar aturdido por 1 ronda." },
      { numero: 20, resultado: "Estallido sobrenatural – El hechizo ignora resistencia e inmunidad, y el objetivo queda propenso o empujado 10 pies (a tu elección). Además, recuperas un espacio de conjuro de nivel 1." }
    ],
    pifias: [
      { numero: 1, resultado: "Colapso arcano – La magia se revierte con violencia. Recibes el daño completo de tu propio hechizo (si aplica) y quedas aturdido 1 ronda." },
      { numero: 2, resultado: "Descontrol total – El hechizo cambia de objetivo a una criatura aliada aleatoria a 30 pies." },
      { numero: 3, resultado: "Rechazo mágico – El conjuro falla y pierdes ese espacio de conjuro y tu acción. Además, quedas mudo hasta el inicio de tu siguiente turno." },
      { numero: 4, resultado: "Retroalimentación mental – Sufres 1d10 daño psíquico y quedas aturdido hasta el final de tu turno." },
      { numero: 5, resultado: "Fragmentación de control – Si el hechizo tenía área, explota en una dirección aleatoria (1d8, tipo brújula)." },
      { numero: 6, resultado: "Canalización rota – Pierdes la concentración de cualquier otro hechizo activo inmediatamente." },
      { numero: 7, resultado: "Distorsión elemental – El tipo de daño del hechizo se transforma en uno que el objetivo es inmune (a elección del DJ)." },
      { numero: 8, resultado: "Efecto cómico – En lugar del hechizo, aparece un puñado de plumas, burbujas o una bandada de gallinas. Sin efecto mecánico, pero vergonzoso." },
      { numero: 9, resultado: "Mini explosión – Una onda mágica te rodea: tú y todas las criaturas a 5 pies hacen salvación de Destreza CD 12 o sufren 1d6 de daño de fuerza." },
      { numero: 10, resultado: "Interferencia residual – No puedes lanzar cantrips hasta el final de tu siguiente turno." },
      { numero: 11, resultado: "Palabras quebradas – Las palabras del hechizo se enredan. Desventaja en tu próxima tirada de ataque con hechizo." },
      { numero: 12, resultado: "Resonancia dispersa – Si era un hechizo de área, su efecto se reduce a la mitad del área normal." },
      { numero: 13, resultado: "Mente nublada – No puedes reaccionar hasta el inicio de tu próximo turno." },
      { numero: 14, resultado: "Símbolos volátiles – El hechizo deja un rastro visible de energía mágica inestable: los enemigos tienen ventaja en rastrear tu aura mágica durante 1 hora." },
      { numero: 15, resultado: "Eco inofensivo – El hechizo produce un efecto ilusorio sin daño. El objetivo es consciente del fallo." },
      { numero: 16, resultado: "Mana distorsionado – Tu siguiente hechizo cuesta un espacio de conjuro 1 nivel más alto (solo si puedes pagarlo)." },
      { numero: 17, resultado: "Ruptura momentánea – Sufres desventaja en todas las tiradas de ataque con hechizo hasta el final de tu siguiente turno." },
      { numero: 18, resultado: "Pérdida de foco – Tu hechizo se dispersa inútilmente. No puedes lanzar hechizos de concentración hasta que completes un descanso corto." },
      { numero: 19, resultado: "Zancada inestable – Quedas derribado al liberar energía mágica sin control." },
      { numero: 20, resultado: "Desvanecimiento menor – El hechizo falla, pero no hay consecuencias adicionales. Solo un fallo simple." }
    ],
    superCriticos: [
      { numero: 1, resultado: "Leyenda viva – Tu ataque o hechizo ignora toda resistencia, inmunidad y reducción de daño, causa el máximo daño posible y provoca un efecto adicional narrativo heroico (como cortar una torre por la mitad, desarmar moralmente a una horda, o resucitar la esperanza de un pueblo)." },
      { numero: 2, resultado: "Aniquilación precisa – El ataque golpea tan perfectamente que el objetivo sufre un nivel de agotamiento, pierde su reacción, y queda aturdido hasta el final de su siguiente turno. Si es un enemigo menor, muere automáticamente." },
      { numero: 3, resultado: "Milagro ridículo – Golpeas al enemigo haciendo un truco imposible: con rebote, por accidente, o tropezando... pero igual lo haces pedazos. Recibes una inspiración por ser “el favorito de los dioses del caos”." },
      { numero: 4, resultado: "Momento de leyenda personal – El DM crea un momento único y memorable relacionado con el trasfondo o motivación del PJ. Además del daño crítico, obtienes un beneficio narrativo potente o recompensa futura." }
    ],
    superPifias: [
      { numero: 1, resultado: "Autodaño catastrófico – Golpeas accidentalmente una parte vital, canalizas mal el hechizo o tropiezas con tu propia flecha: recibes el daño máximo de tu propio ataque o conjuro, y quedas inconsciente por 1 minuto (puedes tirar salvación de Constitución CD 15 al final de cada turno para levantarte antes)." },
      { numero: 2, resultado: "Caída en cadena – Tu fallo inicia una reacción en cadena: destruyes cobertura, haces caer aliados cercanos, activas trampas o colapsa el entorno inmediato. El DJ elige un efecto dramáticamente desastroso." },
      { numero: 3, resultado: "“¡Ups! Eso no iba ahí.” – Te enredas, tiras tu arma, conjuras un hechizo menor inútil (como Prestidigitación con confeti), o simplemente te caes sentado. Pierdes tu acción, y los enemigos tienen ventaja para golpearte hasta el inicio de tu siguiente turno." },
      { numero: 4, resultado: "Elección del Director – El DM elige un efecto absurdo, dramático o emocionalmente cruel. Puede implicar ridículo, consecuencias narrativas imprevistas, o dañar accidentalmente a un NPC clave. (¡Tiempo para improvisar con malicia equilibrada!)" }
    ]
  },
  melee: {
    criticos: [
      { numero: 1, resultado: "Tropiezo glorioso – Golpeas, pero quedas mal posicionado: haces el daño crítico, pero quedas sin reacción hasta tu próximo turno." },
      { numero: 2, resultado: "Golpe desgarrador – El impacto deja una herida sangrante: el objetivo sufre 1d4 de daño al inicio de su turno durante 1 minuto, CD 12 Medicina para detenerlo." },
      { numero: 3, resultado: "Ruido ensordecedor – Tu arma golpea con fuerza sónica: el objetivo queda ensordecido hasta el final de su siguiente turno." },
      { numero: 4, resultado: "Ráfaga de adrenalina – Recuperas 1d6 PG al golpear." },
      { numero: 5, resultado: "Golpe preciso – El objetivo tiene desventaja en su próxima tirada de ataque." },
      { numero: 6, resultado: "Desarme parcial – El impacto hace que el objetivo suelte su escudo o arma secundaria (si tiene)." },
      { numero: 7, resultado: "Apertura en defensa – El próximo ataque contra el objetivo tiene ventaja." },
      { numero: 8, resultado: "Movimiento brutal – Puedes mover al objetivo 5 pies en cualquier dirección (sin provocar ataques de oportunidad)." },
      { numero: 9, resultado: "Daño profundo – El golpe penetra la defensa: ignora resistencia al daño contundente/cortante/perforante." },
      { numero: 10, resultado: "Combo oportuno – Si un aliado está cuerpo a cuerpo con el objetivo, puede usar su reacción para hacer un ataque." },
      { numero: 11, resultado: "Balance perfecto – Ganas +2 a la CA hasta el inicio de tu próximo turno." },
      { numero: 12, resultado: "Mareado – El objetivo debe pasar una salvación de Constitución CD 13 o quedar aturdido hasta el final de su siguiente turno." },
      { numero: 13, resultado: "Rotura de guardia – El objetivo no puede usar reacción hasta su próximo turno." },
      { numero: 14, resultado: "Ataque salvaje – Repite un dado de daño (elige el menor) y usa el nuevo resultado." },
      { numero: 15, resultado: "Vibración contundente – El arma resuena: criaturas a 5 pies del objetivo hacen salvación de Fuerza CD 13 o quedan derribadas." },
      { numero: 16, resultado: "Rompearmadura – El golpe reduce temporalmente la CA del objetivo en –1 hasta que reciba reparación o magia." },
      { numero: 17, resultado: "Crítico aplastante – Si el objetivo es una criatura pequeña o menor, queda automáticamente derribado." },
      { numero: 18, resultado: "Maestría marcial – Puedes usar una maniobra de Batalla (como el Guerrero) aunque no la tengas." },
      { numero: 19, resultado: "Desgarro brutal – Además del daño, el objetivo queda sangrando (1d6 por turno) hasta que use acción para detenerlo." },
      { numero: 20, resultado: "Impacto legendario – Causas máximo daño con el arma, y el objetivo queda derribado y silenciado 1 turno si falla una salvación de Constitución CD 15. Además, ganas inspiración si no tienes." }
    ],
    pifias: [
      { numero: 1, resultado: "Desastre total – Golpeas accidentalmente a un aliado cercano, causando daño normal, y quedas derribado." },
      { numero: 2, resultado: "Autoimpacto – Te golpeas a ti mismo, sufriendo daño normal y quedas aturdido hasta el final de tu siguiente turno." },
      { numero: 3, resultado: "Pérdida de arma – Tu arma se suelta de tus manos y cae a 10 pies de distancia en una dirección aleatoria." },
      { numero: 4, resultado: "Resbalón fatal – Pierdes el equilibrio y quedas prono." },
      { numero: 5, resultado: "Golpe al aire – Tu ataque falla tan estrepitosamente que quedas sin reacción hasta tu próximo turno." },
      { numero: 6, resultado: "Desbalance – Tu postura se ve comprometida; el próximo ataque contra ti tiene ventaja." },
      { numero: 7, resultado: "Golpe torpe – Tu arma se atasca momentáneamente, requiriendo una acción adicional para liberarla." },
      { numero: 8, resultado: "Mala postura – Sufres desventaja en tu próxima tirada de ataque." },
      { numero: 9, resultado: "Interferencia – Tu ataque falla y proporcionas ventaja al próximo ataque de un enemigo cercano." },
      { numero: 10, resultado: "Tensión muscular – Sufres una leve lesión; tu velocidad se reduce en 10 pies hasta el final de tu siguiente turno." },
      { numero: 11, resultado: "Confusión momentánea – Pierdes la concentración; no puedes realizar ataques de oportunidad hasta tu próximo turno." },
      { numero: 12, resultado: "Golpe desviado – Tu arma impacta una superficie dura, causando 1d4 de daño a tu arma (si aplica)." },
      { numero: 13, resultado: "Paso en falso – Te desplazas involuntariamente 5 pies en una dirección aleatoria, potencialmente provocando ataques de oportunidad." },
      { numero: 14, resultado: "Fallo ruidoso – El estruendo de tu fallo alerta a enemigos cercanos, quienes obtienen ventaja en percepción para detectarte." },
      { numero: 15, resultado: "Error táctico – Tu fallo abre una oportunidad; un enemigo cercano puede usar su reacción para moverse 5 pies sin provocar ataques de oportunidad." },
      { numero: 16, resultado: "Desgaste – Tu arma muestra signos de deterioro; si falla una tirada de salvación de Constitución CD 10, sufre una penalización de –1 al daño hasta ser reparada." },
      { numero: 17, resultado: "Fallo embarazoso – Tu torpeza es evidente; sufres desventaja en pruebas de Carisma relacionadas con combate hasta el final del encuentro." },
      { numero: 18, resultado: "Desenfoque – Pierdes de vista a tu objetivo; necesitas gastar una acción adicional para reorientarte." },
      { numero: 19, resultado: "Golpe ineficaz – Tu ataque apenas roza al enemigo, causando daño mínimo (1 punto)." },
      { numero: 20, resultado: "Fallo menor – Tu ataque falla sin consecuencias adicionales." }
    ],
    superCriticos: [
      { numero: 1, resultado: "Épico – \"Hazaña Legendaria\" – Con un golpe magistral, atraviesas las defensas del enemigo, causando daño máximo y dejando a todos los enemigos cercanos atónitos por un turno. Además, ganas inspiración." },
      { numero: 2, resultado: "Brutal – \"Desmembramiento\" – Tu ataque es tan devastador que amputas una extremidad del enemigo, imposibilitándole usarla y causando sangrado severo (1d6 por turno) hasta que reciba atención médica." },
      { numero: 3, resultado: "Cómico – \"Golpe de Suerte\" – Intentabas un movimiento torpe, pero tropiezas y caes sobre el enemigo, causándole daño crítico y dejándolo prono de la sorpresa. Todos ríen, incluso los enemigos." },
      { numero: 4, resultado: "Elección del DJ – \"Momento Clave\" – El DJ decide un efecto único y narrativo acorde a la situación: puede ser un cambio en la batalla, una revelación importante o una ventaja táctica inesperada." }
    ],
    superPifias: [
      { numero: 1, resultado: "Brutal – \"Autolesión Grave\" – Fallaste tan estrepitosamente que te golpeas a ti mismo, causando daño máximo y quedando inconsciente por 1 minuto." },
      { numero: 2, resultado: "Épica – \"Desastre Total\" – Tu arma se rompe en mil pedazos, y en el proceso, caes al suelo, quedando prono y desarmado. Además, provocas un efecto colateral que afecta negativamente a tus aliados." },
      { numero: 3, resultado: "Cómica – \"Resbalón Ridículo\" – Intentas un movimiento elegante, pero resbalas con tu propia capa, cayendo de forma aparatosa y quedando prono. Todos, amigos y enemigos, estallan en carcajadas." },
      { numero: 4, resultado: "Elección del DJ – \"Consecuencia Narrativa\" – El DJ determina una consecuencia única y significativa, como la pérdida de un objeto valioso, la activación de una trampa o la llegada de refuerzos enemigos." }
    ]
  },
  distancia: {
    criticos: [
      { numero: 1, resultado: "Disparo desviado – El proyectil rebota y golpea al objetivo, causando daño normal." },
      { numero: 2, resultado: "Golpe superficial – El proyectil roza al objetivo, causando daño normal y dejando una herida sangrante (1d4 de daño al inicio de su turno durante 1 minuto, CD 12 Medicina para detenerlo)." },
      { numero: 3, resultado: "Impacto preciso – El proyectil impacta en un punto vulnerable, causando daño normal y reduciendo la velocidad del objetivo en 10 pies hasta el final de su siguiente turno." },
      { numero: 4, resultado: "Tiro certero – El proyectil impacta con precisión, causando daño normal y otorgando desventaja al objetivo en su próxima tirada de ataque." },
      { numero: 5, resultado: "Disparo debilitante – El proyectil impacta en una extremidad, causando daño normal y haciendo que el objetivo tenga desventaja en su próxima tirada de habilidad." },
      { numero: 6, resultado: "Golpe aturdidor – El proyectil impacta en la cabeza del objetivo, causando daño normal y obligándolo a realizar una salvación de Constitución CD 13 o quedar aturdido hasta el final de su siguiente turno." },
      { numero: 7, resultado: "Disparo desarmante – El proyectil impacta en el arma del objetivo, obligándolo a realizar una salvación de Destreza CD 13 o soltar su arma." },
      { numero: 8, resultado: "Tiro de precisión – El proyectil impacta con tal precisión que el próximo ataque contra el objetivo tiene ventaja." },
      { numero: 9, resultado: "Disparo penetrante – El proyectil atraviesa la armadura del objetivo, ignorando resistencia al daño de proyectiles." },
      { numero: 10, resultado: "Tiro en cadena – Si hay otro enemigo a 5 pies detrás del objetivo, el proyectil continúa y le causa daño normal." },
      { numero: 11, resultado: "Disparo intimidante – El impacto del proyectil intimida a los enemigos cercanos, quienes deben realizar una salvación de Sabiduría CD 13 o tener desventaja en su próxima tirada de ataque." },
      { numero: 12, resultado: "Golpe crítico – El proyectil impacta en un punto vital, causando daño crítico (doble de dados de daño)." },
      { numero: 13, resultado: "Disparo paralizante – El proyectil impacta en una articulación, causando daño crítico y reduciendo la velocidad del objetivo a 0 hasta el final de su siguiente turno." },
      { numero: 14, resultado: "Tiro devastador – El proyectil impacta con tal fuerza que el objetivo debe realizar una salvación de Fuerza CD 13 o quedar derribado." },
      { numero: 15, resultado: "Disparo doble – Realizas un segundo ataque inmediato contra otro objetivo dentro del alcance." },
      { numero: 16, resultado: "Golpe maestro – El proyectil impacta en un punto vital, causando daño crítico y otorgando ventaja en tu próxima tirada de ataque." },
      { numero: 17, resultado: "Disparo letal – El proyectil impacta en un punto vital, causando daño crítico y obligando al objetivo a realizar una salvación de Constitución CD 15 o quedar inconsciente durante 1 minuto." },
      { numero: 18, resultado: "Tiro perfecto – El proyectil impacta con tal precisión que el objetivo queda incapacitado hasta el final de su siguiente turno." },
      { numero: 19, resultado: "Disparo legendario – El proyectil atraviesa al objetivo, causando daño crítico y afectando a otro enemigo en línea recta detrás de él con daño normal." },
      { numero: 20, resultado: "Impacto épico – El proyectil impacta en un punto vital, causando daño máximo y dejando al objetivo atónito durante 1 minuto. Además, ganas inspiración si no la tienes." }
    ],
    pifias: [
      { numero: 1, resultado: "Desastre total – El proyectil impacta en un aliado cercano, causándole daño crítico. Además, tu arma se rompe y quedas prono." },
      { numero: 2, resultado: "Autolesión grave – El proyectil rebota y te golpea, causándote daño crítico y dejándote aturdido hasta el final de tu siguiente turno." },
      { numero: 3, resultado: "Pérdida de arma – Tu arma se suelta de tus manos y cae a 10 pies de distancia en una dirección aleatoria." },
      { numero: 4, resultado: "Resbalón fatal – Pierdes el equilibrio y quedas prono." },
      { numero: 5, resultado: "Golpe al aire – Tu ataque falla tan estrepitosamente que quedas sin reacción hasta tu próximo turno." },
      { numero: 6, resultado: "Desbalance – Tu postura se ve comprometida; el próximo ataque contra ti tiene ventaja." },
      { numero: 7, resultado: "Arma atascada – Tu arma se atasca momentáneamente, requiriendo una acción adicional para liberarla." },
      { numero: 8, resultado: "Mala postura – Sufres desventaja en tu próxima tirada de ataque." },
      { numero: 9, resultado: "Interferencia – Tu ataque falla y proporcionas ventaja al próximo ataque de un enemigo cercano." },
      { numero: 10, resultado: "Tensión muscular – Sufres una leve lesión; tu velocidad se reduce en 10 pies hasta el final de tu siguiente turno." },
      { numero: 11, resultado: "Confusión momentánea – Pierdes la concentración; no puedes realizar ataques de oportunidad hasta tu próximo turno." },
      { numero: 12, resultado: "Golpe desviado – Tu proyectil impacta una superficie dura, causando 1d4 de daño a tu arma (si aplica)." },
      { numero: 13, resultado: "Paso en falso – Te desplazas involuntariamente 5 pies en una dirección aleatoria, potencialmente provocando ataques de oportunidad." },
      { numero: 14, resultado: "Fallo ruidoso – El estruendo de tu fallo alerta a enemigos cercanos, quienes obtienen ventaja en percepción para detectarte." },
      { numero: 15, resultado: "Error táctico – Tu fallo abre una oportunidad; un enemigo cercano puede usar su reacción para moverse 5 pies sin provocar ataques de oportunidad." },
      { numero: 16, resultado: "Desgaste – Tu arma muestra signos de deterioro; si falla una tirada de salvación de Constitución CD 10, sufre una penalización de –1 al daño hasta ser reparada." },
      { numero: 17, resultado: "Fallo embarazoso – Tu torpeza es evidente; sufres desventaja en pruebas de Carisma relacionadas con combate hasta el final del encuentro." },
      { numero: 18, resultado: "Desenfoque – Pierdes de vista a tu objetivo; necesitas gastar una acción adicional para reorientarte." },
      { numero: 19, resultado: "Golpe ineficaz – Tu ataque apenas roza al enemigo, causando daño mínimo (1 punto)." },
      { numero: 20, resultado: "Fallo menor – Tu ataque falla sin consecuencias adicionales." }
    ],
    superCriticos: [
      { numero: 1, resultado: "Épico – \"Disparo Legendario\" – Tu proyectil atraviesa el corazón del enemigo con precisión milimétrica, causando daño máximo y dejando a todos los enemigos cercanos atónitos por un turno. Además, ganas inspiración." },
      { numero: 2, resultado: "Brutal – \"Desmembramiento\" – Tu ataque es tan devastador que amputas una extremidad del enemigo, imposibilitándole usarla y causando sangrado severo (1d6 por turno) hasta que reciba atención médica." },
      { numero: 3, resultado: "Cómico – \"Golpe de Suerte\" – Intentabas un disparo torpe, pero el proyectil rebota en una superficie y golpea al enemigo, causándole daño crítico y dejándolo prono de la sorpresa. Todos ríen, incluso los enemigos." },
      { numero: 4, resultado: "Elección del DJ – \"Momento Clave\" – El DJ decide un efecto único y narrativo acorde a la situación: puede ser un cambio en la batalla, una revelación importante o una ventaja táctica inesperada." }
    ],
    superPifias: [
      { numero: 1, resultado: "Brutal – \"Autolesión Grave\" – Fallaste tan estrepitosamente que te golpeas a ti mismo, causando daño máximo y quedando inconsciente por 1 minuto." },
      { numero: 2, resultado: "Épica – \"Desastre Total\" – Tu arma se rompe en mil pedazos, y en el proceso, caes al suelo, quedando prono y desarmado. Además, provocas un efecto colateral que afecta negativamente a tus aliados." },
      { numero: 3, resultado: "Cómica – \"Resbalón Ridículo\" – Intentas un disparo elegante, pero resbalas con tu propia capa, cayendo de forma aparatosa y quedando prono. Todos, amigos y enemigos, estallan en carcajadas." },
      { numero: 4, resultado: "Elección del DJ – \"Consecuencia Narrativa\" – El DJ determina una consecuencia única y significativa, como la pérdida de un objeto valioso, la activación de una trampa o la llegada de refuerzos enemigos." }
    ]
  }
};