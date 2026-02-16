
window.addEventListener('load', setupPage);

async function setupPage() {
  const index = await fetch('index.json').then(result => result.json());
  const icons = index.icons;

  getElementById('icon-count')
    .replaceChildren(
      new Intl.NumberFormat().format(Object.keys(icons).length)
    )

  getElementById('icon-gallery')
    .replaceChildren(
      ...Object.keys(icons).map(iconId => {
        return createElement('a')
          .setAttribute('href', '#' + iconId)
          .setAttribute('title', iconId)
          .append(
            createElement('img')
              .setAttribute('style', 'width:15px;height:15px;')
              .setAttribute('src', `i/${iconId}.svg`),
          )
        }
      )
    );
  getElementById('icon-list')
    .replaceChildren(
      ...(await Promise.all(Object.keys(icons).map(async iconId => {
        return createElement('div')
          .setAttribute('id', iconId)
          .setAttribute('class', 'icon-item')
          .append(
             createElement('div')
              .setAttribute('style', 'display:flex;justify-content:space-between;align-items: baseline;')
              .append(
                createElement('h4')
                  .setAttribute('class', 'icon-label')
                  .append(
                    createElement('img')
                      .setAttribute('style', 'width:15px;height:15px;filter: invert(1);margin-right: 10px;vertical-align:middle;')
                      .setAttribute('src', `i/${iconId}.svg`),
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
                      .setAttribute('href', `https://github.com/waysidemapping/pinhead-map-icons/blob/main/icons/${(icons[iconId].srcdir ? icons[iconId].srcdir + '/' : '') + iconId}.svg`)
                      .append(
                        'GitHub'
                      )
                  )
              ),
            createElement('div')
              .setAttribute('class', 'icon-variants')
              .append(
                createElement('div')
                  .setAttribute('style', 'display:flex;flex-direction:column;justify-content:end;gap:15px;height:105px;')
                  .append(
                     createElement('div')
                      .append(
                        createElement('img')
                          .setAttribute('style', 'width:15px;height:15px;image-rendering:crisp-edges;image-rendering:pixelated;')
                          .setAttribute('src', await rasterizeSVG(`i/${iconId}.svg`, 15, 15)),
                        createElement('p')
                          .append('1x')
                      ),
                    createElement('div')
                      .append(
                        createElement('img')
                          .setAttribute('style', 'width:15px;height:15px;image-rendering:crisp-edges;image-rendering:pixelated;')
                          .setAttribute('src', await rasterizeSVG(`i/${iconId}.svg`, 30, 30)),
                        createElement('p')
                          .append('2x')
                      )
                  ),
                createElement('div')
                  .setAttribute('style', `width:105px;height:105px;flex-shrink:0;position:relative;`)
                  .append(
                    createElement('img')
                      .setAttribute('style', 'width:100%;height:100%;')
                      .setAttribute('src', `demo_map.svg`),
                    createElement('img')
                      .setAttribute('style', `width:15px;height:15px;position:absolute;top:45px;left:45px;filter:invert(1);`)
                      .setAttribute('src', `i/${iconId}.svg`)
                  ),
                createElement('div')
                  .append(
                    createElement('img')
                      .setAttribute('style', 'width:105px;height:105px;background:url(15x15_grid.svg);background-size:contain;')
                      .setAttribute('src', `i/${iconId}.svg`)
                  ),
                createElement('div')
                  .setAttribute('style', 'width:100%;')
                  .append(
                    createElement('textarea')
                      .setAttribute('readonly', true)
                      .setAttribute('class', 'svg-code')
                      .setAttribute('style', 'height:105px;')
                      .addEventListener('focus', e => e.target.select())
                      .append(await fetch(`i/${iconId}.svg`).then(result => result.text()))
                  )
              )
          )
        }
      )))
    );
}

async function rasterizeSVG(svgUrl, width, height) {
  const img = new Image();
  img.src = svgUrl;

  await img.decode(); // wait until image loads

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const rasterURL = canvas.toDataURL("image/png");
  return rasterURL;
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