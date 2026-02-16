
window.addEventListener('load', _ => {
  fetch('complete.json')
    .then(result => result.json())
    .then(setupPage);
});

function setupPage(pageData) {
  const parser = new DOMParser();
  const icons = pageData.icons;

  getElementById('icon-count')
    .replaceChildren(
      new Intl.NumberFormat().format(Object.keys(icons).length)
    );

  getElementById('icon-gallery')
    .replaceChildren(
      ...Object.keys(icons).map(iconId => {
        const icon = icons[iconId];
        return createElement('a')
          .setAttribute('href', '#' + iconId)
          .setAttribute('title', iconId)
            .insertAdjacentHTML("afterbegin", icon.svg)
        }
      )
    );

  getElementById('icon-list')
    .replaceChildren(
      ...Object.keys(icons).map(iconId => {
        const icon = icons[iconId];
        let preview1xCanvas, preview2xCanvas, preview3xCanvas;
        const el = createElement('div')
          .setAttribute('id', iconId)
          .setAttribute('class', 'icon-item')
          .append(
             createElement('div')
              .setAttribute('style', 'display:flex;justify-content:space-between;align-items: baseline;')
              .append(
                createElement('h4')
                  .setAttribute('class', 'icon-label')
                  .append(
                    createElement('div')
                      .setAttribute('style', 'width:15px;height:15px;display:inline-block;filter: invert(1);margin-right: 10px;vertical-align:middle;')
                      .insertAdjacentHTML("afterbegin", icon.svg),
                    createElement('span')
                      .setAttribute('style', 'vertical-align:middle;')
                      .append(iconId)
                  ),
                createElement('div')
                  .setAttribute('style', 'display:flex;gap: 10px;')
                  .append(
                    createElement('a')
                      .setAttribute('href', `i/${iconId}.svg`)
                      .append(
                        'Open'
                      ),
                    createElement('a')
                      .setAttribute('href', `i/${iconId}.svg`)
                      .setAttribute('download', true)
                      .append(
                        'Download'
                      ),
                    createElement('a')
                      .setAttribute('href', `https://github.com/waysidemapping/pinhead-map-icons/blob/main/icons/${(icon.srcdir ? icon.srcdir + '/' : '') + iconId}.svg`)
                      .append(
                        'GitHub'
                      )
                  )
              ),
            createElement('div')
              .setAttribute('class', 'icon-variants')
              .append(
                createElement('div')
                  .setAttribute('class', 'res-preview')
                  .append(
                     createElement('div')
                      .setAttribute('class', 'res-preview-group')
                      .append(
                        preview1xCanvas = createElement('canvas')
                          .setAttribute('width', '15')
                          .setAttribute('height', '15')
                          .setAttribute('style', 'width:15px;height:15px;image-rendering:crisp-edges;image-rendering:pixelated;'),
                        createElement('p')
                          .append('1x')
                      ),
                    createElement('div')
                      .setAttribute('class', 'res-preview-group')
                      .append(
                        preview2xCanvas = createElement('canvas')
                          .setAttribute('width', '30')
                          .setAttribute('height', '30')
                          .setAttribute('style', 'width:15px;height:15px;image-rendering:crisp-edges;image-rendering:pixelated;'),
                        createElement('p')
                          .append('2x')
                      ),
                    createElement('div')
                      .setAttribute('class', 'res-preview-group')
                      .append(
                        preview3xCanvas = createElement('canvas')
                          .setAttribute('width', '45')
                          .setAttribute('height', '45')
                          .setAttribute('style', 'width:15px;height:15px;image-rendering:crisp-edges;image-rendering:pixelated;'),
                        createElement('p')
                          .append('3x')
                      )
                  ),
                createElement('div')
                  .setAttribute('style', `width:105px;height:105px;flex:0 0 auto;position:relative;`)
                  .append(
                    createElement('img')
                      .setAttribute('loading', 'lazy')
                      .setAttribute('decoding', 'async')
                      .setAttribute('style', 'width:105px;height:105px;')
                      .setAttribute('src', `demo_map.svg`),
                    createElement('div')
                      .setAttribute('style', `width:15px;height:15px;position:absolute;top:45px;left:45px;filter:invert(1);`)
                      .insertAdjacentHTML("afterbegin", icon.svg)
                  ),
                createElement('div')
                  .setAttribute("class", "pixel-grid")
                  .insertAdjacentHTML("afterbegin", icon.svg),
                createElement('textarea')
                  .setAttribute('readonly', true)
                  .setAttribute('class', 'svg-code')
                  .setAttribute('style', 'height:105px;width: 100%;')
                  .addEventListener('focus', e => e.target.select())
                  .append(icon.svg)
              )
          );
          const canvasContexts = [
            preview1xCanvas.getContext("2d"),
            preview2xCanvas.getContext("2d"),
            preview3xCanvas.getContext("2d")
          ];
          canvasContexts.forEach((ctx, i) => ctx.scale(i + 1, i + 1));
          parser.parseFromString(icon.svg, "image/svg+xml").querySelectorAll("path").forEach(pathEl => {
            const path = new Path2D(pathEl.getAttribute("d"));
            canvasContexts.forEach(ctx => ctx.fill(path));
          });
          return el;
        }
      )
    );
}

// Creates a new HTML element where certain functions return the element itself.
export function createElement(...args) {
  let el = document.createElement(...args);
  wrapElementFunctions(el);
  return el;
}

// Gets an HTML element where certain functions return the element itself.
export function getElementById(...args) {
  let el = document.getElementById(...args);
  if (el) wrapElementFunctions(el);
  return el;
}

export function getElementsByName(...args) {
  let els = document.getElementsByName(...args);
  if (els) return els.map(wrapElementFunctions);
}

// Wraps certain functions of the element so they return the
// element itself in order to enable chaining.
function wrapElementFunctions(el) {
  let fnNames = ['addEventListener', 'append', 'appendChild', 'replaceChildren', 'setAttribute', 'insertAdjacentHTML'];
  for (let i in fnNames) {
    let fnName = fnNames[i];
    let fn = el[fnName];
    el[fnName] = function(...args) {
      fn.apply(this, args);
      return el;
    };
  }
}