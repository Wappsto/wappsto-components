import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import { bindActionCreators } from 'redux';
import React, { Component, Fragment } from 'react';

import * as items from 'wappsto-redux/actions/items';
import * as request from 'wappsto-redux/actions/request';

import { getRequest } from 'wappsto-redux/selectors/request';
import { getEntity, getEntities } from 'wappsto-redux/selectors/entities';
import { getItem } from 'wappsto-redux/selectors/items';


function mapStateToProps(state, componentProps){
  let { type, id, childType, sort } = componentProps;
  let parent;
  let url = "/" + type;
  if(id && childType){
    url += "/" + id + "/" + childType;
    parent = { id, type };
    entitiesType = childType;
  } else {
    entitiesType = type;
  }

  let items = getEntities(state, entitiesType, { parent });
  if(sort){
    items.sort(sort);
  }
  return {
    url: url,
    request: getRequest(state, url, "GET"),
    items: items,
    fetched: getItem(state, url + "_fetched"),
    length: getItem(state, url + "_length")
  }
}

function mapDispatchToProps(dispatch){
  return {
    ...bindActionCreators({...request, ...items}, dispatch)
  }
}

export class List extends Component {
  static propTypes = {
    id: PropTypes.string,
    type: PropTypes.string.isRequired,
    chidlType: PropTypes.string,
    sort: PropTypes.func
  }

  constructor(props){
    super(props);
    this.refresh = this.refresh.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.offset = 0;
    this.limit = 50;
    this.canLoadMore = false;
  }

  componentDidMount(){
    if(!this.props.fetched
      || this.props.length !== this.props.items.length
      || (this.props.request && this.props.request.status === "error")){
      this.props.setItem(this.props.url + "_fetched", true);
      this.refresh();
    }
  }

  componentDidUpdate(prevProps){
    this.updateItemCount(prevProps);
    this.updateListLoadMore();
  }

  updateItemCount(prevProps){
    let request = this.props.request;
    let prevRequest = prevProps.request;
    if(prevRequest && prevRequest.status === "pending" && request && request.status === "success"){
      this.props.setItem(this.props.url + "_length", this.props.items.length);
    }
  }

  updateListLoadMore(){
    let list = this.props.items;
    let request = this.props.request;
    if(request && request.status === "success"){
      this.offset = list.length;
      if(list.length % this.limit === 0){
        this.canLoadMore = true;
      } else {
        this.canLoadMore = false;
      }
    }
  }

  loadMore(){
    if(this.canLoadMore){
      this.makeRequest({
        query: {
          expand: 0,
          offset: this.offset
        }
      });
    }
  }

  refresh(){
    this.makeRequest({
      query: { expand: 0 },
      reset: true
    });
  }

  makeRequest(options){
    let request = this.props.request;
    if(!request || request.status !== "pending"){
      this.props.makeRequest("GET", this.props.url, null, options);
    }
  }
}

export function connect(component){
  return reduxConnect(mapStateToProps, mapDispatchToProps)(component);
}

export default connect(List);
