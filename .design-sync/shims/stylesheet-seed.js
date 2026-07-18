// Siembra el <style id="react-native-stylesheet"> al FINAL del <body> antes
// de que react-native-web inicialice (RNW adopta cualquier elemento existente
// con ese id vía getElementById). Sin esto, RNW lo crea al principio del
// <head> y el render-check del conversor lo confunde con el primer mount
// ([id^="r"]) → falso "[RENDER] root empty" en todas las tarjetas.
// Este módulo debe ser el PRIMER import de entry.ts (se ejecuta antes que
// cualquier módulo de react-native-web). En páginas que carguen el bundle en
// el <head> (body aún nulo) no hace nada y RNW se comporta como siempre.
if (typeof document !== 'undefined' && document.body && !document.getElementById('react-native-stylesheet')) {
  const el = document.createElement('style');
  el.id = 'react-native-stylesheet';
  document.body.appendChild(el);
}
