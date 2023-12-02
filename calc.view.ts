namespace $.$$ {

	export class $hyoo_calc extends $.$hyoo_calc {
		
		@ $mol_mem
		sheet_fund() {
			return this.yard().world().Fund( $hyoo_calc_sheet )
		}
		
		@ $mol_mem
		sheet_id() {
			return this.$.$mol_state_arg.value( 'sheet' ) || ''
		}
		
		@ $mol_mem
		sheet() {
			
			const id = $mol_int62_string_ensure( this.sheet_id() )
			if( !id ) return null
			
			return this.sheet_fund().Item( id )
			
		}
		
		@ $mol_action
		sheet_new() {
			const sheet = this.sheet_fund().make()
			this.$.$mol_state_arg.go({ sheet: sheet.land.id() })
			return sheet
		}
		
		@ $mol_action
		sheet_fork() {
			
			const prev = this.sheet()
			
			const title = this.title()
			const formulas = this.formulas()
			
			const next = this.sheet_new()
			
			if( prev ) {
				
				next.steal( prev )
				
			} else {
				
				next.title( title )
				
				for( let cell in formulas ) {
					next.formula( cell, formulas[ cell ] )
				}
				
			}
			
			return next
		}

		@ $mol_action
		sheet_changable() {
			const sheet = this.sheet()
			if( sheet?.changable() ) return sheet
			return this.sheet_fork()
		}
		
		@ $mol_mem
		formulas_default() {
			const source = this.$.$mol_state_arg.value( 'source' )
			if( source ) {
				return this.$.$mol_fetch.json( source ) as Record< string, string >
			}
			return this.$.$mol_state_arg.dict()
		}

		@ $mol_mem
		formulas() {
			
			const formulas = {} as { [ key : string ] : string }
			
			const sheet = this.sheet()
			if( sheet ) {
				
				for( const cell of sheet.cells() ) {
					formulas[ cell ] = sheet.formula( cell )
				}
				
			} else {
				
				let args = this.formulas_default()
				const ids = Object.keys( args ).filter( param => this.id2coord( param ) )
				for( let id of ids ) formulas[ id ] = args[ id ]
				
			}
			
			return formulas
		}

		@ $mol_mem_key
		formula_name( id : string ) {
			
			const found = /^([\p{Letter}_]*)\s*=/u.exec( this.formulas()[ id ] )
			if( !found ) return null

			return found[1]
		}

		@ $mol_mem
		refs() {
			
			const formulas = this.formulas()
			const vars = {} as Record< string , string >
			
			for( const id in formulas ) {
				
				const name = this.formula_name( id )
				if( !name ) continue

				if( vars[ name ] ) throw new Error( `Names conflict: ${ id }, ${ vars[ name ] }` )
				
				vars[ name ] = id
			}

			return vars
		}

		@ $mol_mem_key
		id2coord( id : string ) : [ number , number ] | null {
			
			const parsed = /^([A-Z]+)(\d+)$/i.exec( id )
			if( !parsed ) return null

			return [ this.string2number( parsed[1].toUpperCase() ) , Number( parsed[2] ) ]
		}

		coord2id( coord : [ number , number ] ) : string {
			return `${ this.number2string( coord[0] ) }${ coord[1] }`
		}

		@ $mol_mem
		dimensions() {

			const dims = {
				rows : 3 ,
				cols : 3 ,
			}

			for( let key of Object.keys( this.formulas() ) ) {
				const coord = this.id2coord( key )!

				const rows = coord[1] + 2
				const cols = coord[0] + 2
				
				if( rows > dims.rows ) dims.rows = rows
				if( cols > dims.cols ) dims.cols = cols
			}
			
			return dims
		}

		@ $mol_mem
		col_ids() {
			return Array( this.dimensions().cols ).join(' ').split(' ').map( ( _ , i )=> i + 1 )
		}

		@ $mol_mem
		row_ids() {
			return Array( this.dimensions().rows ).join(' ').split(' ').map( ( _ , i )=> i + 1 )
		}

		number2string( numb : number ) {
			
			if( numb <= 0 ) return ''
			numb --
			
			const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			let str = ''
			
			do {
				str = letters[ numb % 26 ] + str
				numb = Math.floor( numb / 26 )
			} while ( numb )
			
			return str
		}

		string2number( str : string ) {
			let numb = 0
			for( let symb of str.split( '' ) ) {
				numb = numb * 26
				numb += symb.charCodeAt( 0 ) - 65
			}
			return numb + 1
		}

		@ $mol_mem
		title( next? : string ) {
			if( next === undefined ) {
				return this.sheet()?.title() ?? this.$.$mol_state_arg.value( `title` ) ?? super.title()
			} else {
				return this.sheet_changable().title( next )
			}
		}

		col_title( id : number ) {
			return this.number2string( id )
		}

		col_head_content( id: number ) {
			
			const coord = this.coord()
			if( coord[0] !== id ) return [ this.Col_title(id) ]
			
			return [
				this.Col_title(id),
				this.Col_tools(id),
			]
			
		}

		row_title( id : number ) {
			return String( id )
		}

		row_head_content( id: number ) {
			
			const coord = this.coord()
			if( coord[1] !== id ) return [ this.Row_title(id) ]
			
			return [
				this.Row_title(id),
				this.Row_tools(id),
			]
			
		}

		@ $mol_mem
		head_cells() {
			return [ this.Col_head( 0 ) , ... this.col_ids().map( colId => this.Col_head( colId ) ) ]
		}
		
		cells( row_id : number ) {
			return [ this.Row_head( row_id ) , ... this.col_ids().map( col_id => this.Cell( this.coord2id([ col_id , row_id ]) ) ) ]
		}

		@ $mol_mem_key
		selected( id : string , next? : boolean ) {
			return this.Cell( this.pos( next ? id : undefined ) ) === this.Cell( id )
		}

		@ $mol_mem
		pos( next? : string ) : string {
			if( next !== $mol_mem_cached( ()=> this.pos() ) ) {
				new $mol_after_frame( ()=> {
					this.Edit_current().Edit().focused( true )
					this.ensure_visible( this.Cell( next ), 'nearest' )
				} )
			}
			return next || super.pos()
		}

		@ $mol_mem
		coord( next? : [ number , number ] ) {
			return this.id2coord( this.pos( next && this.coord2id( next ) ) )!
		}

		Edit_current() {
			return this.Edit( this.pos() )
		}

		current_row( next? : number ) {
			return this.coord( next === undefined ? undefined : [ this.coord()[0] , next ] )[ 1 ]
		}

		current_col( next? : number ) {
			return this.coord( next === undefined ? undefined : [ next , this.coord()[1] ] )[ 0 ]
		}

		@ $mol_mem_key
		formula( id : string , next? : string ) {
			if( next === undefined ) {
				return this.sheet()?.formula( id, next ) || this.formulas_default()[ id ] || ''
			} else {
				return this.sheet_changable().formula( id, next )
			}
		}

		formula_current( next? : string ) {
			return this.formula( this.pos() , next )
		}

		@ $mol_mem
		sandbox() {
			return new $mol_func_sandbox( Math , {

				'$' : new Proxy( {} , { get : ( _ , id : string ) : any => {
					return this.result( id )
				} } ) ,
				
				'$$' : new Proxy( {} , { get : ( _ , id : string ) : any => {
					return this.formula( id )
				} } ) ,
				
				'_' : new Proxy( {} , { get : ( _ , name : string ) : any => {
					return this.result( this.refs()[ name ] )
				} } ) ,
				
				'__' : new Proxy( {} , { get : ( _ , name : string ) : any => {
					return this.refs()[ name ]
				} } ) ,

				'RANGE' : ( from : string , to : string )=> this.results([ from , to ]) ,

				'SUM' : ( values : number[] )=> values.reduce( ( accum , item ) => accum + item , 0 ) ,
				
				'AVG' : ( values : number[] )=> values.reduce( ( accum , item ) => accum + item , 0 ) / values.length ,

				'MAX' : ( values : number[] )=> values.reduce( ( max , item ) => item > max ? item : max , Number.NEGATIVE_INFINITY ) ,

				'MIN' : ( values : number[] )=> values.reduce( ( min , item ) => item < min ? item : min , Number.POSITIVE_INFINITY ) ,

			} )
		}

		@ $mol_mem_key
		results( range : [ string , string ] ) {
			
			const start = this.id2coord( range[0] )!
			const end = this.id2coord( range[1] )!

			const results = [] as unknown[]

			for( let row = start[0] ; row <= end[0] ; ++row ) {
				for( let col = start[1] ; col <= end[1] ; ++col ) {
					results.push( this.result( this.coord2id([ row , col ]) ) )
				}
			}

			return results

		}

		sub() {
			return [
				this.Head() ,
				this.Current() ,
				... this.hint_showed() ? [ this.Hint() ] : [] ,
				this.Body() ,
			]
		}

		@ $mol_mem
		hint() {
			return super.hint().replace( '{funcs}' , Object.getOwnPropertyNames( Math ).map( name => "`" + name + "`" ).join( ', ' ) )
		}

		@ $mol_mem_key
		cell_content( id : string ) : string {
			
			const name = this.formula_name( id )
			
			let val = this.result( id )
			if( typeof val === 'object' ) val = JSON.stringify( val )

			return name ? `${name} = ${val}` : String( val )
		}

		@ $mol_mem_key
		func( id : string ) {
			const formula = this.formula( id )
			if( !/^([\p{Letter}_]*)?\s*=/u.test( formula ) ) return ()=> formula
			
			const code = 'return ' + formula
			.replace( /([A-Z]+[0-9]+):([A-Z]+[0-9]+)/g , ( found : string , from : string , to : string )=> `RANGE('${ from.toLowerCase() }','${ to.toLowerCase() }')` )
			.replace( /@([A-Z]+[0-9]+)\b/g , '$$.$1' )
			.replace( /([^.])([A-Z]+[0-9]+)\b/g , '$1$.$2' )
			.replace( /^([\p{Letter}_]*)?\s*=/u , '' )
			
			return this.sandbox().eval( code )
		}

		@ $mol_mem_key
		result( id : string ) : string | number {
			$mol_wire_solid()
			const res = this.func( id )()
			if( res === undefined ) return ''
			if( res === '' ) return ''
			if( isNaN( res ) ) return res
			if( res && typeof res === 'object' ) return JSON.stringify( res )
			return Number( res )
		}

		paste( event : ClipboardEvent ) {
			
			const table = event.clipboardData!.getData( 'text/plain' ).trim().split( /\r?\n/ ).map( row => row.split( '\t' ) ) as string[][]
			if( table.length === 1 && table[0].length === 1 ) return
			
			const sheet = this.sheet_changable()

			const [ col_start , row_start ] = this.id2coord( this.pos() )!

			for( let row in table ) {
				for( let col in table[ row ] ) {
					const id = this.coord2id([ col_start + Number( col ) , row_start + Number( row ) ])
					sheet.formula( id, table[ row ][ col ] )
				}
			}

			event.preventDefault()
		}

		download_file() {
			return `${ this.title() }.csv`
		}

		download_uri() {

			const table : string[][] = []
			const dims = this.dimensions()

			for( let row = 1 ; row < dims.rows ; ++ row ) {

				const row_data = [] as any[]
				table.push( row_data )
				
				for( let col = 0 ; col < dims.cols ; ++ col ) {
					row_data[ col ] = String( this.result( this.coord2id([ col , row ]) ) )
				}

			}

			const content = table.map( row => row.map( val => `"${ val.replace( /"/g , '""' ) }"` ).join( ';' ) ).join( '\n' )

			return `data:text/csv;charset=utf-8,${ encodeURIComponent( content ) }`
			
		}
		
		@ $mol_action
		col_ins( col: number ) {
			
			const sheet = this.sheet_changable()
			const prev = this.formulas()
			
			for( const id in prev ) {
				
				const coord = this.id2coord( id )!
				
				if( coord[0] < col ) {
					sheet.formula( id, prev[ id ] )
				} else {
					if( coord[0] === col ) sheet.formula( id, '' )
					sheet.formula( this.coord2id([ coord[0] + 1, coord[1] ]), prev[ id ] )
				}
				
			}
			
		}

		@ $mol_action
		row_ins( row: number ) {
			
			const sheet = this.sheet_changable()
			const prev = this.formulas()
			
			for( const id in prev ) {
				
				const coord = this.id2coord( id )!
				
				if( coord[1] < row ) {
					sheet.formula( id, prev[ id ] )
				} else {
					if( coord[1] === row ) sheet.formula( id, '' )
					sheet.formula( this.coord2id([ coord[0], coord[1] + 1 ]), prev[ id ] )
				}
				
			}
			
		}

		@ $mol_action
		col_right( col: number ) {
			
			const sheet = this.sheet_changable()
			const prev = this.formulas()
			
			for( const id in prev ) {
				
				const coord = this.id2coord( id )!
				
				if( coord[0] === col ) {
					var pair = this.coord2id([ coord[0] + 1, coord[1] ])
				} else if( coord[0] === col + 1 ) {
					var pair = this.coord2id([ coord[0] - 1, coord[1] ])
				} else {
					sheet.formula( id, prev[ id ] )
					continue
				}
				
				sheet.formula( pair, prev[ id ] || '' )
				sheet.formula( id, prev[ pair ] || '' )
				
			}
			
			const coord = this.coord()
			this.coord([ coord[0] + 1, coord[1] ])
			
		}

		@ $mol_action
		row_down( row: number ) {
			
			const sheet = this.sheet_changable()
			const prev = this.formulas()
			
			for( const id in prev ) {
				
				const coord = this.id2coord( id )!
				
				if( coord[1] === row ) {
					var pair = this.coord2id([ coord[0], coord[1] + 1 ])
				} else if( coord[1] === row + 1 ) {
					var pair = this.coord2id([ coord[0], coord[1] - 1 ])
				} else {
					sheet.formula( id, prev[ id ] )
					continue
				}
				
				sheet.formula( pair, prev[ id ] || '' )
				sheet.formula( id, prev[ pair ] || '' )
				
			}
			
			const coord = this.coord()
			this.coord([ coord[0], coord[1] + 1 ])
			
		}

	}

	export class $hyoo_calc_cell extends $.$hyoo_calc_cell {

		click( event? : Event ) {
			if( event ) this.selected( true )
		}

		type() {
			const value = this.text()
			return isNaN( Number( value ) ) ? 'string' : 'number'
		}

	}

}
