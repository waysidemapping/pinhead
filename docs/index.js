let packageJson;

let version;
let majorVersion

window.addEventListener('load', _ => {
  fetch('package.json')
    .then(result => result.json())
    .then(obj => {
      packageJson = obj;
      version = packageJson.version;
      majorVersion = version.split('.')[0];
      fetch(`v${majorVersion}/index.complete.json`)
        .then(result => result.json())
        .then(setupPage);
    });
});

function setupPage(pageData) {
  const parser = new DOMParser();
  const icons = pageData.icons;

  document.getElementById('icon-count')
    .replaceChildren(
      new Intl.NumberFormat().format(Object.keys(icons).length)
    );

  document.getElementById('sidebar')
    .insertAdjacentHTML("afterbegin", [
      new Chainable('h2')
        .append(
          new Chainable('img')
            .setAttribute('class', 'inline')
            .setAttribute('src', packageJson.versionIcon || "https://pinhead.ink/v1/heart.svg"),
            new Chainable('span')
              .append('v' + version)
        ),
      new Chainable('a')
        .setAttribute('href', `https://github.com/waysidemapping/pinhead/releases/download/v${version}/waysidemapping-pinhead-${version}.tgz`)
        .append(
            new Chainable('span')
              .append('download'),
            new Chainable('img')
              .setAttribute('class', 'inline')
              .setAttribute('src', "https://pinhead.ink/v2/arrow_down_to_down_bracket.svg")
          ),
      new Chainable('a')
          .setAttribute('href', `https://www.npmjs.com/package/@waysidemapping/pinhead/v/${version}`)
          .setAttribute('target', '_blank')
          .append(
            new Chainable('span')
              .append('npm package'),
            new Chainable('img')
              .setAttribute('class', 'inline')
              .setAttribute('src', `https://pinhead.ink/v${majorVersion}/arrow_top_right_from_square_outline.svg`)
          ),
      new Chainable('a')
        .setAttribute('href', `https://github.com/waysidemapping/pinhead/releases/tag/v${version}`)
        .setAttribute('target', '_blank')
        .append(
          new Chainable('span')
            .append('github release'),
          new Chainable('img')
            .setAttribute('class', 'inline')
            .setAttribute('src', `https://pinhead.ink/v${majorVersion}/arrow_top_right_from_square_outline.svg`)
        )
    ].join(''));

  document.getElementById('icon-gallery')
    .insertAdjacentHTML("afterbegin",
      Object.keys(icons).map(iconId => {
        const icon = icons[iconId];
        return new Chainable('a')
          .setAttribute('href', '#' + iconId)
          .setAttribute('title', iconId)
          .insertAdjacentHTML("afterbegin", icon.svg)
        }
      ).join('')
    );

  document.getElementById('icon-list')
    .insertAdjacentHTML("afterbegin",
      Object.keys(icons).map(iconId => {
        return new Chainable('div')
          .setAttribute('id', iconId)
          .setAttribute('class', 'icon-item')
          // add a placeholder label to enable in-browser search and find before everything is loaded
          .append(iconId);
      }).join('')
    );

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        loadIconItemInner(entry.target);
        observer.unobserve(entry.target);
      }
    }
  }, {
    // preload before visible
    rootMargin: "200px" 
  });

  document.querySelectorAll(".icon-item")
    .forEach(el => observer.observe(el));

  function loadIconItemInner(el) {
    const iconId = el.getAttribute('id');
    const icon = icons[iconId];
    el.innerHTML = [
    new Chainable('div')
      .setAttribute('style', 'display:flex;justify-content:space-between;align-items: baseline;')
      .append(
        new Chainable('h4')
          .setAttribute('class', 'icon-label')
          .append(
            new Chainable('div')
              .setAttribute('style', 'width:15px;height:15px;display:inline-block;margin-right: 10px;vertical-align:middle;')
              .insertAdjacentHTML("afterbegin", icon.svg),
            new Chainable('span')
              .setAttribute('style', 'vertical-align:middle;')
              .append(iconId)
          ),
        new Chainable('div')
          .setAttribute('class', 'links')
          .append(
            new Chainable('a')
              .setAttribute('href', `v${majorVersion}/${iconId}.svg`)
              .append(
                'open'
              ),
            new Chainable('a')
              .setAttribute('href', `v${majorVersion}/${iconId}.svg`)
              .setAttribute('download', true)
              .append(
                'download'
              ),
            new Chainable('a')
              .setAttribute('href', `https://github.com/waysidemapping/pinhead/blob/main/icons/${(icon.srcdir ? icon.srcdir + '/' : '') + iconId}.svg`)
              .append(
                'github'
              )
          )
      ),
    new Chainable('div')
      .setAttribute('class', 'icon-variants')
      .append(
        new Chainable('div')
          .setAttribute('class', 'res-previews')
          .append(
              new Chainable('div')
              .setAttribute('class', 'res-preview-wrap')
              .setAttribute('title', 'rendered at 15x15 pixels')
              .append(
                new Chainable('canvas')
                  .setAttribute('class', 'res-preview icon')
                  .setAttribute('icon', iconId)
                  .setAttribute('scale', 1)
                  .setAttribute('width', 15)
                  .setAttribute('height', 15),
                new Chainable('p')
                  .append('1x')
              ),
            new Chainable('div')
              .setAttribute('class', 'res-preview-wrap')
              .setAttribute('title', 'rendered at 30x30 pixels')
              .append(
                new Chainable('canvas')
                  .setAttribute('class', 'res-preview icon')
                  .setAttribute('icon', iconId)
                  .setAttribute('scale', 2)
                  .setAttribute('width', 30)
                  .setAttribute('height', 30),
                new Chainable('p')
                  .append('2x')
              ),
            new Chainable('div')
              .setAttribute('class', 'res-preview-wrap')
              .setAttribute('title', 'rendered at 45x45 pixels')
              .append(
                new Chainable('canvas')
                  .setAttribute('class', 'res-preview icon')
                  .setAttribute('icon', iconId)
                  .setAttribute('scale', 3)
                  .setAttribute('width', 45)
                  .setAttribute('height', 45),
                new Chainable('p')
                  .append('3x')
              )   
          ),
        new Chainable('div')
          .setAttribute("class", "map-preview")
          .append(
            new Chainable('div')
              .setAttribute("class", "map-preview-background"),
            new Chainable('div')
              .setAttribute('style', `width:15px;height:15px;position:absolute;top:45px;left:45px;color:#fff;`)
              .insertAdjacentHTML("afterbegin", icon.svg)
          ),
        new Chainable('div')
          .setAttribute("class", "pixel-grid")
          .insertAdjacentHTML("afterbegin", icon.svg),
        new Chainable('div')
          .setAttribute("class", "text-areas")
          .append(
            new Chainable('textarea')
              .setAttribute('readonly', true)
              .setAttribute('class', 'svg-code')
              .append(icon.svg),
            new Chainable('textarea')
              .setAttribute('readonly', true)
              .setAttribute('class', 'img-code')
              .append(`<img src="https://pinhead.ink/v${majorVersion}/${iconId}.svg" width="15px" height="15px"/>`)
          )
      )
    ].join('');

    el.querySelectorAll('textarea')
      .forEach(el => el.addEventListener('focus', e => e.target.select()));

    el.querySelectorAll('canvas.icon').forEach(canvas => {
      const scale = parseInt(canvas.getAttribute('scale'));
      const context = canvas.getContext("2d");
      if (scale !== 1) context.scale(scale, scale);
      const paths = parser.parseFromString(icons[canvas.getAttribute('icon')].svg, "image/svg+xml")
        .querySelectorAll("path")
        .values()
        .map(pathEl => new Path2D(pathEl.getAttribute("d")));
      paths.forEach(path => context.fill(path));
    });
  }
}

class Chainable {
  constructor(tag) {
    this.tag = tag;
    this.attrs = "";
    this.children = "";
  }
  setAttribute(k, v) {
    this.attrs += ` ${k}="${v}"`;
    return this;
  }
  insertAdjacentHTML(_, html) {
    this.children += html;
    return this;
  }
  append(...args) {
    this.children += Array.from(args).map(arg => arg.toString()).join('');
    return this;
  }
  toString() {
    return `<${this.tag}${this.attrs}>${this.children}</${this.tag}>`;
  }
}