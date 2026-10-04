cmake_minimum_required(VERSION 3.20)
project(AdaptiveShieldPipeline CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---------------------------------------------------------------------------
# Source files
# ---------------------------------------------------------------------------
set(PIPELINE_SOURCES
    cpp/pipeline.cpp
    cpp/wasm_bindings.cpp
)

add_executable(pipeline ${PIPELINE_SOURCES})
target_include_directories(pipeline PRIVATE cpp)

# ---------------------------------------------------------------------------
# Emscripten output options
#   - Output into src/wasm/ so Vite picks up pipeline.js at build time.
#   - MODULARIZE=1 wraps the module in a factory function, avoiding global
#     name collisions and enabling async initialisation in pipelineBridge.js.
#   - EXPORT_ES6=1 emits an ES module so Vite/Rollup can tree-shake it.
#   - ALLOW_MEMORY_GROWTH handles large regex / reputation map growth.
# ---------------------------------------------------------------------------
if(EMSCRIPTEN)
    set_target_properties(pipeline PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/src/wasm"
        OUTPUT_NAME "pipeline"
    )

    target_link_options(pipeline PRIVATE
        -lembind
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_NAME='createPipelineModule'"
        "SHELL:-s EXPORT_ES6=1"
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s ENVIRONMENT='web,worker'"
        # Optimise for size in production; swap -Os for -O0 during dev.
        -Os
    )
endif()
