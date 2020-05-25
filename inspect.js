var injected =
    injected || (function() {
      const Inspector =
          function() {
        this.getData = this.getData.bind(this);
        this.draw = this.draw.bind(this);
        this.setOptions = this.setOptions.bind(this);
        this.toggleScroll = this.toggleScroll.bind(this);
        this.preventDefault = this.preventDefault.bind(this);
        this.preventDefaultForScrollKeys =
            this.preventDefaultForScrollKeys.bind(this);
        this.keys = {37: 1, 38: 1, 39: 1, 40: 1};
        this.contentNode = 'xpath-content';
        this.wrapNode = 'xpath-wrap';
        this.canvasNode = 'xpath-canvas';
        this.cssNode = 'xpath-css';
        this.getFields = this.getFields.bind(this), this.curXPathId = 0;
        this.scrollEnabled = true;
        this.enableScroll = this.enableScroll.bind(this);
        this.disableScroll = this.disableScroll.bind(this);
        this.selectSchema = this.selectSchema.bind(this);
        this.insertSchema = this.insertSchema.bind(this);
        this.data = [];
        this.fields = [];
        window.screenshots = [];
        this.scrollTimes = 0;
        this.reset = this.reset.bind(this);
        this.nItems = 3;
      }

          Inspector.prototype = {

        ancestorIds: function(e) {
          var idsList = [];

          while (e != null) {
            idsList.push(e.id);
            e = e.parentNode;
          }
          return idsList;
        },

        selectSchema: function(e) {
          console.log(e.target.value);


          let ecomListingJson = ['f1', 'f2'];

          let prodListingJson = ['f3', 'f4'];

          if (e.target.value === 'ecommerce-listing') {
            this.insertSchema(ecomListingJson);
          } else if (e.target.value === 'product') {
            this.insertSchema(prodListingJson);
          } else if (e.target.value === 'blank') {
          }
        },

        insertSchema: function(schema) {
          var inputs =
              document.querySelectorAll('#xpath-content > ul > li > input');
          for (var f in inputs) {
            if (f < schema.length) {
              inputs[f].value = schema[f]
            }
          }
        },

        getFields: function() {
          var inputs =
              document.querySelectorAll('#xpath-content > ul > li > input');
          var result = [];
          for (var n in inputs) {
            result.push(inputs[n].value);
          }
          return result;
        },

        reset: function() {
          this.addHtml();
        },

        getData: function(e) {
          if (!this.ancestorIds(e.target).includes(this.contentNode)) {
            e.stopImmediatePropagation();
            e.preventDefault && e.preventDefault();
            e.stopPropagation && e.stopPropagation();

            const XPath = this.getXPath(e.target);
            var curXpathIdAttr = 'xpath-' + this.curXPathId;
            this.XPath = XPath;

            var curEle = document.getElementById(curXpathIdAttr);

            if (curEle != null) {
              curEle.innerText = XPath;
              this.curXPathId += 1;

              var scrollLeft =
                      window.pageXOffset || document.documentElement.scrollLeft,
                  scrollTop =
                      window.pageYOffset || document.documentElement.scrollTop;

              var elerect = e.target.getBoundingClientRect();

              this.data.push([scrollLeft, scrollTop, elerect]);
            }
            this.options.clipboard && (this.copyText(XPath));
          } else {
            if (e.target.id == 'add-field-btn') {
              var inp = document.createElement('input');
              inp.type = 'text';
              inp.name = 'xpath-field-name-new';
              inp.placeholder = 'Field';
              inp.onclick = 'return false;';

              this.nItems += 1;

              var span = document.createElement('span');
              span.id = 'xpath-' + this.nItems;

              var li = document.createElement('li');
              li.appendChild(inp);
              li.appendChild(span);

              var ul = document.querySelector('#xpath-content > ul');
              ul.appendChild(li);


            } else if (e.target.id == 'send-xpaths-btn') {
              var objs = {
                'url': window.location.href,
                'fields': this.getFields(),
                'data': this.data,
                'screenshots': window.screenshots
              };
              / /
              console.log(objs);

              // now hide elements
              document.getElementById('xpath-content').style.display = 'none';
              document.getElementById(this.canvasNode).style.display = 'none';

              // this.removeStyles();

              console.log('Removed styles + annotation area');
              var thisVar = this;
              setTimeout(function() {
                // now take a screengrab
                var port = chrome.extension.connect({name: 'screenshot'});
                port.postMessage({request: 'screenshot'});
                port.onMessage.addListener(function(msg) {
                  window.screenshots.push(msg);

                  // now do the request
                  chrome.runtime.sendMessage({
                    contentScriptQuery: 'sendAnnotations',
                    body: JSON.stringify(objs),
                    function(response) {
                      console.log(response);
                    }
                  });

                  thisVar.removeHtml();
                  thisVar.addHtml();
                  thisVar.curXPathId = 0;

                  document.getElementById('xpath-content').style.display =
                      'block';
                  document.getElementById(thisVar.canvasNode).style.display =
                      'block';
                  window.scrollBy(0, window.innerHeight);
                  this.scrollTimes += 1;

                  console.log(thisVar.data);
                  console.log(thisVar.fields);
                  console.log(window.screenshots);
                });
              }, 1000);
            }
          }
        },

        copyText: function(XPath) {
          var hdInp = document.createElement('input');
          hdInp.setAttribute('value', XPath);
          document.body.appendChild(hdInp);
          hdInp.select();
          document.execCommand('copy');
          document.body.removeChild(hdInp);
        },

        draw: function(e) {
          var xpath_node = document.getElementById('xpath-content');
          if (e.path.includes(xpath_node)) {
            return
          }
          const canvas = document.getElementById(this.canvasNode);
          const context = canvas.getContext('2d');
          this.width = canvas.width = window.innerWidth - 20;
          this.height = canvas.height = window.innerHeight;

          const iStyle = e.target.getBoundingClientRect();
          const cStyle = window.getComputedStyle(e.target);

          const item = {
            width: iStyle.width,
            height: iStyle.height,
            top: iStyle.top,
            left: iStyle.left,
            pdTop: parseInt(cStyle.paddingTop, 10),
            pdRight: parseInt(cStyle.paddingRight, 10),
            pdBottom: parseInt(cStyle.paddingBottom, 10),
            pdLeft: parseInt(cStyle.paddingLeft, 10)
          };

          const width = item.width - item.pdRight - item.pdLeft;
          const height = item.height - item.pdBottom - item.pdTop;

          context.fillStyle = 'rgba(68,182,226,0.3)';
          context.fillRect(
              item.left + item.pdLeft, item.top + item.pdTop, width, height);

          canvas.style.top =
              `${Math.abs(document.body.getBoundingClientRect().top)}px`;
        },

        activate: function() {
          this.addStyles();
          this.addHtml();
          this.addListeners();
          this.disableScroll();
          window.screenshots = [];
        },

        deactivate: function() {
          this.removeStyles();
          this.removeHtml();
          this.removeListeners();
        },

        addStyles: function() {
          if (!document.getElementById(this.cssNode)) {
            const styles = document.createElement('style');
            styles.innerText = this.styles;
            styles.id = this.cssNode;
            document.getElementsByTagName('head')[0].appendChild(styles);
          }
        },

        removeStyles: function() {
          const cssNode = document.getElementById(this.cssNode);
          cssNode && cssNode.remove();
        },

        addHtml: function() {
          if (!document.getElementById(this.wrapNode)) {
            let outerHtml = `<div id="${this.wrapNode}"><canvas id="${
                this.canvasNode}" /></div>`;
            outerHtml = new DOMParser().parseFromString(outerHtml, 'text/html');
            document.body.appendChild(outerHtml.getElementById(this.wrapNode));
          }

          var outerHtmlContent = `
            <div id="xpath-content">
              <select id="xpath-options">
                <option value="blank">Blank</option>
                <option value="ecommerce-listing">Ecommerce Listing</option>
                <option value="product">Product Page</option>
              </select>
              <ul>
                <li>
                  <input type="text" name="xpath-field-name-0" placeholder="Field 1" onclick="return false;"><span id="xpath-0">TODO</span>
                </li>
                <li>
                  <input type="text" name="xpath-field-name-1" placeholder="Field 2" onclick="return false;"><span id="xpath-1">TODO</span>
                </li>
                <li>
                  <input type="text" name="xpath-field-name-2" placeholder="Field 3" onclick="return false;"><span id="xpath-2">TODO</span>
                </li>
                <li>
                  <input type="text" name="xpath-field-name-3" placeholder="Field 4" onclick="return false;"><span id="xpath-3">TODO</span>
                </li>
              </ul>
              <button id="add-field-btn">+</button><button id="send-xpaths-btn">Send</button>
            </div>
          `

          outerHtmlContent =
              new DOMParser().parseFromString(outerHtmlContent, 'text/html');
          document.body.appendChild(
              outerHtmlContent.getElementsByTagName('body')[0]);
        },

        removeHtml: function() {
          const wrapNode = document.getElementById(this.wrapNode);
          const contentNode = document.getElementById(this.contentNode);
          wrapNode && wrapNode.remove();
          contentNode && contentNode.remove();
        },

        addListeners: function() {
          document.addEventListener('click', this.getData, true);

          var select = document.querySelector('#xpath-options');
          select.addEventListener('change', this.selectSchema, true);

          this.options.inspector &&
              (document.addEventListener('mouseover', this.draw))
          //(document.getElementById('scroll-toggle-btn')
          //     .removeEventListener('click', this.draw, true)) &&
          //(document.getElementById('scroll-toggle-btn')
          //     .removeEventListener('click', this.getData, true)) &&
        },

        preventDefault: function(e) {
          e = e || window.event;
          if (e.preventDefault) e.preventDefault();
          e.returnValue = false;
        },

        preventDefaultForScrollKeys: function(e) {
          if (this.keys[e.keyCode]) {
            this.preventDefault(e);
            return false;
          }
        },

        enableScroll: function() {
          if (window.removeEventListener)
            window.removeEventListener(
                'DOMMouseScroll', this.preventDefault, false);
          document.removeEventListener(
              'wheel', this.preventDefault,
              {passive: false});  // Enable scrolling in Chrome
          window.onmousewheel = document.onmousewheel = null;
          window.onwheel = null;
          window.ontouchmove = null;
          document.onkeydown = null;
        },

        disableScroll: function() {
          if (window.addEventListener)  // older FF
            window.addEventListener(
                'DOMMouseScroll', this.preventDefault, false);
          document.addEventListener(
              'wheel', this.preventDefault,
              {passive: false});                 // Disable scrolling in Chrome
          window.onwheel = this.preventDefault;  // modern standard
          window.onmousewheel = document.onmousewheel =
              this.preventDefault;                   // older browsers, IE
          window.ontouchmove = this.preventDefault;  // mobile
          document.onkeydown = this.preventDefaultForScrollKeys;
        },

        toggleScroll: function(event) {
          console.log(this.scrollEnabled);
          if (this.scrollEnabled) {
            this.disableScroll();
            this.scrollEnabled = false;
          } else {
            this.enableScroll();
            this.scrollEnabled = true;
          }
        },

        removeListeners: function() {
          document.removeEventListener('click', this.getData, true);
          this.options.inspector &&
              (document.removeEventListener('mouseover', this.draw));
        },

        getOptions: function() {
          const storage = chrome.storage && (chrome.storage.local)
          const promise = storage.get(
              {inspector: true, clipboard: true, shortid: true, position: 'bl'},
              this.setOptions);
          (promise && promise.then) && (promise.then(this.setOptions()));
        },

        setOptions: function(options) {
          this.options = options;
          let position = 'bottom:0;left:0';
          switch (options.position) {
            case 'tl':
              position = 'top:0;left:0';
              break;
            case 'tr':
              position = 'top:0;right:0';
              break;
            case 'br':
              position = 'bottom:0;right:0';
              break;
            default:
              break;
          }
          this.styles = `\
        * {cursor:crosshair!important;}\
        #xpath-wrap {pointer-events:none;top:0;position:absolute;z-index:10000000;}\
        #xpath-content {${
              position};cursor:initial!important;padding:10px;background:gray;color:white;position:fixed;font-size:14px;z-index:10000000;}\
        #xpath-canvas {position:relative;}\
        .stop-scrolling {height: 100%; overflow: hidden;}`;

          this.activate();
        },

        getXPath: function(el) {
          if (el.id && this.options.shortid) {
            return `//*[@id="${el.id}"]`;
          }
          const parts = [];
          while (el && el.nodeType === Node.ELEMENT_NODE) {
            let nbOfPreviousSiblings = 0;
            let hasNextSiblings = false;
            let sibling = el.previousSibling;
            while (sibling) {
              if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
                  sibling.nodeName == el.nodeName) {
                nbOfPreviousSiblings++;
              }
              sibling = sibling.previousSibling;
            }
            sibling = el.nextSibling;
            while (sibling) {
              if (sibling.nodeName == el.nodeName) {
                hasNextSiblings = true;
                break;
              }
              sibling = sibling.nextSibling;
            }
            const prefix = el.prefix ? el.prefix + ':' : '';
            const nth = nbOfPreviousSiblings || hasNextSiblings ?
                `[${nbOfPreviousSiblings + 1}]` :
                '';
            parts.push(prefix + el.localName + nth);
            el = el.parentNode;
          }
          return parts.length ? '/' + parts.reverse().join('/') : '';
        }
      };

      const inspect = new Inspector();

      chrome.runtime.onMessage.addListener(function(request) {
        if (request.action === 'activate') {
          return inspect.getOptions();
        } else {
          return inspect.deactivate();
        }
      });

      return true;
    })();