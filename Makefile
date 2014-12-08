ns=app
pstj_lib_dir = ../pstj
smjs_lib_dir = ../smjs
template_build_dir = tpl
locale = en
i18n_dir = i18n
build_dir = build
jssource_dir = js
debug = true

include $(pstj_lib_dir)/Makefile.include
pstj_public_source_dirs := $(public_source_dirs)
pstj_template_sources = $(pstj_lib_dir)/$(template_source_dir)/*.soy

include $(smjs_lib_dir)/Makefile.include
smsj_public_source_dirs := $(public_source_dirs)
smjs_template_sources = $(smjs_lib_dir)/$(template_source_dir)/*.soy

this_dir = $(shell basename `pwd`)

template_sources = \
$(template_source_dir)/*.soy \
$(pstj_template_sources) \
$(smjs_template_sources)

soy_compiler_options = \
	--locales $(locale) \
	--messageFilePathFormat "$(i18n_dir)/translations_$(locale).xlf" \
	--shouldProvideRequireSoyNamespaces \
	--shouldGenerateJsdoc \
	--codeStyle concat \
	--cssHandlingScheme GOOG \
	--outputPathFormat '$(template_build_dir)/$(locale)/{INPUT_FILE_NAME_NO_EXT}.soy.js'

# Redefine the variables for a project (from one for a library)
public_deps_file = $(build_dir)/deps.js
public_source_files = $(shell find js/ -name '*.js')


all: \
libraries \
$(lintfile) \
$(build_dir)/$(ns).css \
$(public_deps_file)
	@echo '>>> $(ns) done'

build: $(build_dir)/$(ns).build.js

debug: $(build_dir)/$(ns).debug.js

libraries:
	@cd $(pstj_lib_dir) && make
	@cd $(smjs_lib_dir) && make

$(lintfile): $(public_source_files)
	@$(lint_cmd) $?
	@touch $@

# Create the corresponding translation file
$(i18n_dir)/translations_$(locale).xlf: $(template_sources) $(i18n_dir)
	$(java) $(soy_message_extractor) \
	--outputFile $@ \
	--targetLocaleString $(locale) \
	$(template_sources)

$(template_build_dir)/$(locale):
	mkdir -p $@

# Create the compiled templates.
$(template_build_dir)/$(locale)/*.soy.js:  \
$(i18n_dir)/translations_$(locale).xlf \
$(template_build_dir)/$(locale) \
$(template_sources)
	$(java) $(soy_compiler) $(soy_compiler_options) $(template_sources)

# Build the project deps file.
public_deps_cmdline = \
$(shell echo $(jssource_dir) $(template_build_dir)/$(locale) | sed 's+$(sed_tokenizer)+$(sed_deps_subst)+g')
$(public_deps_file): \
$(public_source_files) \
$(template_build_dir)/$(locale)/*.soy.js
	$(python) $(depswriter) $(public_deps_cmdline) --output_file=$@

# Make the css file anew each time the main or any of its dependencies change
less/$(ns).css: less/$(ns).less $(shell lessc -M less/$(ns).less rtt | sed 's+rtt: ++g')
	lessc --no-ie-compat $< > $@

# read the css ini file for all gss compilations
gss_ini = \
$(shell if [ -f options/$(ns).css.ini ] ; then cat options/$(ns).css.ini ; else cat options/css.ini ; fi | tr '\n' ' ')

# dev
$(build_dir)/$(ns).css: less/$(ns).css
	$(java) $(gss_compiler) \
	--output-renaming-map-format CLOSURE_UNCOMPILED \
	--rename NONE \
	--pretty-print \
	--output-file $@ \
	$(gss_ini) \
	--output-renaming-map $(build_dir)/$(ns)-cssmap.js $^

# build
$(build_dir)/$(ns).build.css: less/$(ns).css
	$(java) $(gss_compiler) \
	--output-renaming-map-format CLOSURE_COMPILED \
	--rename CLOSURE \
	--output-file $@ \
	--output-renaming-map $(build_dir)/$(ns)-cssmap.build.js \
	$(gss_ini) \
	less/$(ns).css

# debug
$(build_dir)/$(ns).debug.css: less/$(ns).css
	$(java) $(gss_compiler) \
	--output-renaming-map-format CLOSURE_COMPILED \
	--rename NONE \
	--pretty-print \
	--output-file $@ \
	--output-renaming-map $(build_dir)/$(ns)-cssmap.debug.js \
	$(gss_ini) \
	less/$(ns).css

$(build_dir)/$(ns)-cssmap.js: $(build_dir)/$(ns).css
$(build_dir)/$(ns)-cssmap.build.js: $(build_dir)/$(ns).build.css
$(build_dir)/$(ns)-cssmap.debug.js: $(build_dir)/$(ns).debug.css

namespace_specific_flags = \
$(shell if [ -f options/$(ns).externs.ini ] ; then cat options/$(ns).externs.ini ; else cat options/externs.ini ; fi | tr '\n' ' ')

# The filelisting for the compiler depends on all possible files.
compiler_js_sources = \
--js="$(jssource_dir)/**.js" \
--js="$(template_build_dir)/$(locale)/**.js" \
--js="../../templates/soyutils_usegoog.js" \
--js="$(closure_library)/closure/goog/**.js" \
--js="$(closure_library)/third_party/closure/goog/mochikit/async/deferred.js" \
--js="$(closure_library)/third_party/closure/goog/mochikit/async/deferredlist.js" \
$(shell echo $(pstj_public_source_dirs) | sed 's+$(sed_tokenizer)+--js="$(pstj_lib_dir)/&/**.js"+g') \
$(shell echo $(smsj_public_source_dirs) | sed 's+$(sed_tokenizer)+--js="$(smjs_lib_dir)/&/**.js"+g') \
--js="!**_test.js"

# The file lister requires all possible files in all used projects.
$(build_dir)/$(ns).filelist.txt: \
$(shell for dir in $(jssource_dir) ; do find $$dir -name '*.js' ; done) \
$(shell for dir in $(pstj_public_source_dirs) ; do find $(pstj_lib_dir)/$$dir -name '*.js' ; done) \
$(shell for dir in $(smsj_public_source_dirs) ; do find $(smjs_lib_dir)/$$dir -name '*.js' ; done)
	$(java) $(js_compiler) \
	--only_closure_dependencies \
	--closure_entry_point=$(ns) \
	--manage_closure_dependencies true \
	--output_manifest $@ \
	--js_output_file /tmp/closure_compiler_build \
	$(compiler_js_sources)

$(build_dir)/$(ns).build.js: \
$(build_dir)/$(ns).filelist.txt \
$(build_dir)/$(ns)-cssmap.build.js
	$(java) $(js_compiler) \
	$(build_js_compiler_option) \
	--compilation_level=ADVANCED \
	--flagfile=options/compile.ini \
	$(namespace_specific_flags) \
	--js_output_file=$@ \
	$(shell cat $(build_dir)/$(ns).filelist.txt | tr '\n' ' ')

$(build_dir)/$(ns).debug.js: \
$(build_dir)/$(ns).filelist.txt \
$(build_dir)/$(ns)-cssmap.debug.js
	$(java) $(js_compiler) \
	$(build_js_compiler_option) \
	--compilation_level=ADVANCED \
	--flagfile=options/compile.ini \
	$(namespace_specific_flags) \
	--debug \
	--formatting=PRETTY_PRINT \
	--js_output_file=$@ \
	$(shell cat $(build_dir)/$(ns).filelist.txt | tr '\n' ' ')

clean:
	rm $(build_dir)/*.js $(build_dir)/*.css $(build_dir)/*filelist*