// Internal Representation for the IDE
var Repr = {
  'uiState': {
    'config': {
      'historyMax': 48,
    },
    'selectedTool': 'select',
    'selectedObjects': [],
    'selectedLayer': '',
    'timeline': {
      'playhead': 0
    }
  },
  'workspace': {
    'objects': {},
    'layers': {
      'default': []
    },
    'metadata': {}
  }
};