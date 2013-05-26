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
		}

	});
	
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('dashboard', ['less:production']);
};