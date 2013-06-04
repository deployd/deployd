module.exports = function (grunt) {
	grunt.initConfig({
		less: {
			production: {
		    options: {
		      paths: ["lib/resources/dashboard/stylesheets"],
		      yuicompress: true
		    },
		    files: {
		      "lib/resources/dashboard/stylesheets/style.css": "lib/resources/dashboard/stylesheets/style.less"
		    }
		  }
		},

		jshint: {
			options: {
			  "laxcomma": true,
			  "expr": true,
			  "proto": true,
			  "lastsemic": true,
			  "laxbreak": true,
			  "strict": false
			},
      cli: [
      	'bin/dpd'
      ],
      dpdJs: [
      	'clib/*.js'
      ],
      dashboard: [
      	'lib/resources/dashboard/js/*.js'
      ],
      collectionDashboard: [
      	'lib/resources/collection/dashboard/js/*.js'
      ],
      lib: [
      	'lib/client/*.js',
      	'lib/resources/*.js',
      	'lib/util/*.js',
      	'lib/*.js'
      ]	
		}

	});
	
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('dashboard', ['less:production']);
};