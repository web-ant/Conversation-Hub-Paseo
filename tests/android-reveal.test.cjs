const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./folder-fixture.cjs');
const jsx=(type,props)=>({type,props});
const platform={OS:'android'};
const hook=()=>{throw new Error('Native folder disclosure must not measure or animate its height');};
const {Reveal}=load('../client/visuals.tsx',{
  './i18n':{t:key=>key},
  react:{useEffect:hook,useRef:hook,useState:hook},
  'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-native':{View:'View',Platform:platform,Animated:{View:'Animated.View'}},
  '@getpaseo/plugin/client/ui':{Icon:'Icon'},
});

test('Android expands long folders at natural height without measurement or animation frames',()=>{
  for(const length of [0,1,90,300]){
    const children=Array.from({length},(_,id)=>({type:'Conversation',props:{id}}));
    const tree=Reveal({open:true,children});
    assert.equal(tree.type,'View');
    assert.equal(tree.props.style.height,undefined);
    assert.notEqual(tree.props.style.display,'none');
    assert.equal(tree.props.onLayout,undefined);
    assert.equal(tree.props.children,children);
    assert.equal(tree.props.pointerEvents,'auto');
    assert.equal(tree.props.accessibilityElementsHidden,false);
  }
});

test('Android folding hides mounted descendants and reopening accepts changed content immediately',()=>{
  const child={type:'NestedFolder',props:{open:true}};
  for(let turn=0;turn<12;turn++){
    const closed=Reveal({open:false,children:child});
    assert.equal(closed.props.children,child);
    assert.equal(closed.props.style.display,'none');
    assert.equal(closed.props.pointerEvents,'none');
    assert.equal(closed.props.importantForAccessibility,'no-hide-descendants');
    const children=[child,...Array.from({length:turn},()=>({type:'Conversation'}))];
    const opened=Reveal({open:true,children});
    assert.equal(opened.props.children,children);
    assert.equal(opened.props.style.height,undefined);
  }
});

test('desktop and iOS retain their animated disclosure component',()=>{
  for(const os of ['web','ios']){
    platform.OS=os;
    const child={type:'Conversation'};
    const tree=Reveal({open:true,children:child});
    assert.equal(typeof tree.type,'function');
    assert.equal(tree.props.open,true);
    assert.equal(tree.props.children,child);
  }
  platform.OS='android';
});
