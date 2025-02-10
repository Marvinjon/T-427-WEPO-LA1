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

    //DOM traversal methods:


    // Returns a list of the unique parent elements of the current elements.
    Fritos.prototype.parent = function (selector = null) {
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
    Fritos.prototype.ancestor = function (selector = null) {
        const ancestors = new Set();
        this.elements.forEach(element => {
        let currentNode = element.parentNode;
        while (currentNode && currentNode !== document.documentElement) {
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

    // Finds all descendant elements matching the given selector.
    Fritos.prototype.find = function (selector) {
        if (!selector) return new Fritos([]);
        const results = [];
        this.elements.forEach(element => {
        const found = element.querySelectorAll(selector);
        results.push(...found);
        });
        return new Fritos(results);
    };


    // Animation method

    Fritos.prototype.animate = function (cssProperties, animationOptions) {
        const {
        duration = 1000,
        delay = '0s',
        easing = 'linear',
        iterationCount = 1,
        fillMode = 'none'
        } = animationOptions || {};
    
        this.elements.forEach(element => {
        // Convert camelCase to kebab-case for CSS properties.
        const keyframeProperties = {};
        Object.entries(cssProperties).forEach(([key, value]) => {
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            keyframeProperties[kebabKey] = value;
        });
    
        // Create a unique animation name.
        const animationName = 'fritos-animation-' + Math.random().toString(36).substr(2, 9);
    
        // Build keyframes string.
        const keyframes = `
            @keyframes ${animationName} {
            to {
                ${Object.entries(keyframeProperties)
                .map(([prop, val]) => `${prop}: ${val};`)
                .join('\n')}
            }
            }
        `;
    
        // Append the style element with the keyframes.
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
    
        // Apply the animation CSS to the element.
        element.style.animation = `${animationName} ${duration}ms ${easing} ${delay} ${iterationCount} ${fillMode}`;
    
        // Clean up after the animation ends.
        element.addEventListener('animationend', () => {
            styleSheet.remove();
            element.style.animation = '';
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
    Fritos.prototype.onEvent = function (eventType, eventFunction) {
        this.elements.forEach(element => {
            element.addEventListener(eventType, eventFunction);
        });
        return this;
    };
    
    
    // Static method to perform remote calls
    Fritos.remoteCall = function (url, options) {
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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
                }
                return response.clone().json().catch(() => response.text()); // Handles non-JSON responses
            })
            .then(data => {
                clearTimeout(timeoutId);
                onSuccess(data);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                onError(error);
            });
    };
    

    // Form validation
    Fritos.prototype.validation = function (validationRules) {
        if (this.elements.length === 0) return {};
        // Assume the first element is the form container.
        const formElement = this.elements[0];
        const inputs = formElement.querySelectorAll('input, textarea, select');
        const errors = {};
    
        inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (!name || !validationRules[name]) return;
    
        const value = input.value;
        const rules = validationRules[name];
        for (let rule of rules) {
            const isValid = rule.valid(value, formElement);
            if (!isValid) {
            errors[name] = rule.message;
            break; // Stop at the first failed rule.
            }
        }
    });
        return errors;
    };
    
    
    // hide elements
    Fritos.prototype.hide = function () {
        this.elements.forEach(element => {
            element.style.display = 'none';
        });
        return this;
    };

    // remove parent elements
    Fritos.prototype.prune = function () {
        const parents = new Set();
        this.elements.forEach(element => {
            const parent = element.parentNode;
            if (!parent) return;
            const grandparent = parent.parentNode;
            if (!grandparent) return;
        
            Array.from(element.childNodes).forEach(child => {
                if (child.nodeType === 1) {
                grandparent.insertBefore(child, parent);
                }
            });
            parents.add(parent);
            });
        
            parents.forEach(parent => {
            if (parent.parentNode) {
                parent.parentNode.removeChild(parent);
            }
            });
        
            return this;
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
