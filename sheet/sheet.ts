namespace $ {
	
	export class $hyoo_calc_sheet extends $hyoo_crowd_struct {
		
		@ $mol_mem
		changable() {
			return this.land.level( '' ) >= $hyoo_crowd_peer_level.mod
		}
		
		@ $mol_mem
		title( next?: string ) {
			return this.sub( 'title', $hyoo_crowd_reg ).str( next )
		}
		
		@ $mol_mem
		formula_node() {
			return this.sub( 'formula', $hyoo_crowd_dict )
		}
		
		@ $mol_mem_key
		formula( cell: string, next?: string ) {
			if( !next && !this.cells().includes( cell ) ) return next ?? ''
			return this.formula_node().sub( cell, $hyoo_crowd_reg ).str( next )
		}
		
		@ $mol_mem
		cells() {
			return this.formula_node().keys()
		}
		
		@ $mol_action
		steal( donor: $hyoo_calc_sheet ) {
			
			this.title( donor.title() )
			
			for( const cell of donor.cells() ) {
				this.formula( cell, donor.formula( cell ) )
			}
			
		}
		
	}

}
