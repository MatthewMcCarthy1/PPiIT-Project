module.exports = function override(config, env) {
    // Add custom Webpack config
    config.devServer = {
      ...(config.devServer || {}),
      allowedHosts: [
        'localhost',
        '.github.dev',
        '.github.io',
        '.gitpod.io',
        '.app.github.dev'
      ]
    };
    
    return config;
  };