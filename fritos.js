const fritos = (function() {
    // Constructor function for fritos
    function Fritos(query) {
        if (typeof query === 'string') {
            this.elements = Array.from(document.querySelectorAll(query));
        } else if (query instanceof Element) {
            this.elements = [query];
        } else if (Array.isArray(query)) {
            this.elements = query;
        } else {
            this.elements = [];
        }
    }
    
    // Method to return a list of all parents of the elements within the result set
    Fritos.prototype.parent = function(selector = null) {
        // Ensure we only consider element nodes (nodeType === 1)
        const parents = [...new Set(
            this.elements
                .map(el => el.parentNode)
                .filter(p => p && p.nodeType === 1)
        )];
        if (!selector) return new Fritos(parents);
        return new Fritos(
            parents.filter(p =>
                selector.startsWith('#')
                    ? p.id === selector.slice(1)
                    : selector.startsWith('.')
                        ? p.classList.contains(selector.slice(1))
                        : p.tagName.toLowerCase() === selector.toLowerCase()
            )
        );
    };

    // Method to return a list of all ancestors of the elements
    Fritos.prototype.ancestor = function(selector = null) {
        const ancestors = new Set();
        
        this.elements.forEach(element => {
            let currentNode = element.parentNode;
            while (currentNode !== null && currentNode !== document.documentElement) {
                if (!selector) {
                    ancestors.add(currentNode);
                } else {
                    if (
                        (selector.startsWith('#') && currentNode.id === selector.slice(1)) ||
                        (selector.startsWith('.') && currentNode.classList.contains(selector.slice(1))) ||
                        currentNode.tagName.toLowerCase() === selector.toLowerCase()
                    ) {
                        ancestors.add(currentNode);
                    }
                }
                currentNode = currentNode.parentNode;
            }
        });
        
        return new Fritos(Array.from(ancestors));
    };
    
    // Method to animate elements
    Fritos.prototype.animate = function(cssProperties, animationOptions) {
        const {
            duration = 1000,
            delay = '0s',
            easing = 'linear',
            iterationCount = 1,
            fillMode = 'none'
        } = animationOptions || {};
    
        this.elements.forEach(element => {
            const keyframeProperties = {};
            Object.entries(cssProperties).forEach(([key, value]) => {
                keyframeProperties[key.replace(/([A-Z])/g, '-$1').toLowerCase()] = value;
            });
    
            element.style.animation = `fritos-animation ${duration}ms ${easing} ${delay} ${iterationCount} ${fillMode}`;
            
            const keyframes = `
                @keyframes fritos-animation {
                    to {
                        ${Object.entries(keyframeProperties)
                        .map(([key, value]) => `${key}: ${value};`)
                        .join('\n')}
                    }
                }
            `;
    
            const styleSheet = document.createElement('style');
            styleSheet.textContent = keyframes;
            document.head.appendChild(styleSheet);
    
            element.addEventListener('animationend', () => {
                styleSheet.remove();
            }, { once: true });
        });
    
        return this;
    };
    
    // Method to find child elements
    Fritos.prototype.find = function(selector) {
        if (!selector) return new Fritos([]);
        
        const results = [];
        this.elements.forEach(element => {
            const found = element.querySelectorAll(selector);
            results.push(...found);
        });
        
        return new Fritos(results);
    };
    
    // Method to attach event listeners
    Fritos.prototype.onEvent = function(eventType, eventFunction) {
        this.elements.forEach(element => {
            element.addEventListener(eventType, eventFunction);
        });
        return this;
    };
    
    // Static method to perform remote calls
    Fritos.remoteCall = function(url, options) {
        const {
            method = 'GET',
            timeout = 45,
            headers = {},
            body = null,
            onSuccess = () => {},
            onError = () => {}
        } = options;
    
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
    
        fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal
        })
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeoutId);
                onSuccess(data);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                onError(error);
            });
    };
    
    // Method to raise elements
    Fritos.prototype.raise = function(level = 1) {
        for (let i = 0; i < level; i++) {
            this.elements.forEach(element => {
                const parent = element.parentNode;
                if (parent && parent.parentNode) {
                    const grandParent = parent.parentNode;
                    grandParent.insertBefore(element, parent);
                    grandParent.insertBefore(parent, element.nextSibling);
                }
            });
        }
        return this;
    };
    
    // Method to set attributes
    Fritos.prototype.attrs = function(name, value) {
        this.elements.forEach(element => {
            element.setAttribute(name, value);
        });
        return this;
    };
    
    // Method to set or get values
    Fritos.prototype.val = function(value) {
        if (value === undefined) {
            return this.elements[0]?.value;
        }
        
        this.elements.forEach(element => {
            element.value = value;
        });
        return this;
    };

    // Create the function to export and attach the static remoteCall
    const f = function(selector) {
        return new Fritos(selector);
    };
    f.remoteCall = Fritos.remoteCall;
    
    return f;
})();

export default fritos;
